import React from 'react';
import {Spinner, Row, Col, Card, Table, Modal, Button} from 'react-bootstrap';
import MainCard from '../App/components/MainCard';
import { withRouter } from 'react-router';
import axios from "axios";

import Aux from '../hoc/_Aux';
import $ from 'jquery';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import utils from "../utils";
import Datetime from 'react-datetime';
import moment from 'moment'
import 'moment/locale/fr';
import Export from "./Export"; // without this line it didn't work
moment.locale('fr');
window.moment = moment;
window.CURRENT_YEAR = (new Date()).getFullYear();

window.jQuery = $;
window.$ = $;
global.jQuery = $;

$.DataTable = require('datatables.net-bs');
require('datatables.net-autofill');
require('datatables.net-buttons-bs');
require('datatables.net-colreorder');
require('datatables.net-keytable');
require('datatables.net-responsive-bs');
require('datatables.net-rowgroup');
require('datatables.net-rowreorder');
require('datatables.net-scroller');
require('datatables.net-select');
require('datatables.net-fixedcolumns');
require('datatables.net-fixedheader');

// sort by date
$.fn.dataTable.moment = function ( format, locale ) {
    var types = $.fn.dataTable.ext.type;

    // Add type detection
    types.detect.unshift( function ( d ) {
        // Strip HTML tags if possible
        if ( d && d.replace ) {
            d = d.replace(/<.*?>/g, '');
        }

        // Null and empty values are acceptable
        if ( d === '' || d === null ) {
            return 'moment-'+format;
        }

        return moment( d, format, locale, true ).isValid() ?
            'moment-'+format :
            null;
    } );

    // Add sorting method - use an integer for the sorting
    types.order[ 'moment-'+format+'-pre' ] = function ( d ) {
        if ( d && d.replace ) {
            d = d.replace(/<.*?>/g, '');
        }
        return d === '' || d === null ?
            -Infinity :
            parseInt( moment( d, format, locale, true ).format( 'x' ), 10 );
    };
};

class DataTables extends React.Component {

    state = {
        showAddModal: false,
        addContent: '', // window.moment() set by mainCard.js on + click
        currentData: {},
        weekDiff: '00:00',
        daysW: 0,
        days7: 0,
        days14: 0,
        days30: 0,
        days60: 0,
        exportMonth: (new Date()).getMonth() + 1,
        exportYear: window.CURRENT_YEAR,
        exportingPDF: false,
        pdfLink: ''
    };

    deleteConfirmHandler = executeIfYes => () => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: 'Êtes-vous sûr?',
            text: 'Un fois ce jour de travail supprimé, vous n\'allez pas pouvoir le récupérer, et TOUTES les heures qui y sont associées seront supprimées.',
            type: 'warning',
            showCloseButton: true,
            showCancelButton: true
        }).then((willDelete) => willDelete.value ? executeIfYes() : null);
    };

    addHandler = () => {
        let addContent = (this.state.addContent._isAMomentObject ? this.state.addContent : window.moment());

        let newForm = {
            "cognitoUser": utils.getUserId(),
            "id": addContent.format('YYYY-MM-DD'),
            "workTime": 0,
            "data": []
        };
        window.WORKDAYS.push(newForm);
        $('#data-table-responsive').DataTable().row.add(newForm).draw();
        this.registerActions();
        this.setState({ showAddModal: false });
        utils.postData('/workdays', 'add')({
            id: newForm.id,
            workTime: newForm.workTime,
            data: newForm.data
        }).then(({ data }) => {
            if ('error' in data.dbData) {
                alert('Une erreur inconnue est survenue.');
                console.log(data.dbData.error);
            }
        });
    };

    registerActions = () => {
        let context = this;

        let detailsBtn = $('#data-table-responsive .btn-details-form');
        let removeBtn = $('#data-table-responsive .btn-remove-form');

        detailsBtn.off('click');
        removeBtn.off('click');

        detailsBtn.on('click', function() {
            context.props.history.push('/day?id=' + this.id.split('details-')[1]);
        });

        removeBtn.on('click', function () {
            context.deleteConfirmHandler(() => {
                let currentId = this.id.split('remove-')[1];
                let rowIdx = window.WORKDAYS.findIndex(item => item.id === currentId);
                let row = context.table.row($(this).parents('tr'));
                row.remove().draw();
                window.WORKDAYS.splice(rowIdx, 1);
                context.getStats();
                utils.deleteData('/workdays')(currentId).then(({ data }) => {
                    if ('error' in data.dbData) {
                        alert('Une erreur inconnue est survenue.');
                        console.log(data.dbData.error);
                    }
                });
            })();
            context.registerActions();
        });
    };

    componentDidMount() {
        $.fn.dataTable.moment('dddd Do MMMM YYYY');

        this.table = $('#data-table-responsive').DataTable( {
            data: window.WORKDAYS,
            order: [[ 0, "desc" ]],
            language: window.DT_TRANSLATION,
            columns: [
                { "data": "id", render: data => utils.capitalizeFirstLetter(moment(data).format('dddd Do MMMM YYYY')) },
                { "data": "workTime", render: diff => {
                    let minutes = diff % 60;
                    let hours = (diff - minutes) / 60;
                    minutes = Math.abs(minutes);
                    hours = Math.abs(hours);
                    let hoursStr = hours <= 10 ? ('0' + hours).slice(-2) : ('' + hours);
                    let minutesStr = ('0' + minutes).slice(-2);
                    return hoursStr + ':' + minutesStr;
                }},
                { "data": "workdayActions", render: (data, type, row) =>
                    '<div class="actionsHtml">' +
                    '<span class="btn btn-sm btn-dark btn-details-form" id="details-' + row.id + '">' +
                    '<i class="feather icon-more-horizontal"></i>' +
                    '</span>' +
                    '<span class="btn btn-sm btn-danger ml-2 btn-remove-form" id="remove-' + row.id + '">' +
                    '<i class="feather icon-trash"></i>' +
                    '</span>' +
                    '</div>'
                }
            ],
            pageLength: 50
        });

        this.registerActions();
        this.getStats();
    }

    getStats = () => {
        let result = {
            weekDiff: '00:00',
            daysW: 0,
            days7: 0,
            days14: 0,
            days30: 0,
            days60: 0
        };
        let currentDayW = Number(window.moment().format('d'));
        let daysWDiff = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }[currentDayW];
        if (window.WORKDAYS !== false && window.WORKDAYS.length > 0) {
            let sortedWorkdays = window.WORKDAYS.sort((a, b) =>
                window.moment(a.id, 'YYYY-MM-DD') > window.moment(b.id, 'YYYY-MM-DD') ? -1 : 1);
            let today = window.moment().startOf('day');
            for (let i = 0; i < sortedWorkdays.length; i++) {
                let concernedDay = window.moment(sortedWorkdays[i].id, 'YYYY-MM-DD');
                let diff = today.diff(concernedDay, 'days');

                if (diff < 0) continue;
                if (diff > 60) break;

                result.daysW = Number(result.daysW);
                result.days7 = Number(result.days7);
                result.days14 = Number(result.days14);
                result.days30 = Number(result.days30);
                result.days60 = Number(result.days60);

                if (diff <= daysWDiff) result.daysW += Number(sortedWorkdays[i].workTime);
                if (diff <= 7) result.days7 += Number(sortedWorkdays[i].workTime);
                if (diff <= 14) result.days14 += Number(sortedWorkdays[i].workTime);
                if (diff <= 30) result.days30 += Number(sortedWorkdays[i].workTime);
                if (diff <= 60) result.days60 += Number(sortedWorkdays[i].workTime);
            }
        }
        ['daysW', 'days7', 'days14', 'days30', 'days60'].forEach(dayEntry => {
            let diff = result[dayEntry];
            let minutes = diff % 60;
            let hours = (diff - minutes) / 60;
            minutes = Math.abs(minutes);
            hours = Math.abs(hours);
            let hoursStr = hours <= 10 ? ('0' + hours).slice(-2) : ('' + hours);
            let minutesStr = ('0' + minutes).slice(-2);
            result[dayEntry] = hoursStr + ':' + minutesStr;
        });

        result.weekDiff = this.getWeekDiff(result.daysW);
        this.setState(result);
    };

    getWeekDiff(daysW) {
        let [hoursW, minutesW] = daysW.split(':').map(Number);

        let workedMinutes = (hoursW * 60) + minutesW;
        let weekMinutes = 42 * 60; // 42 hours per week
        let diffMinutes = workedMinutes - weekMinutes;

        let isDiffNegative = diffMinutes < 0;
        diffMinutes = Math.abs(diffMinutes);

        let minutes = diffMinutes % 60;
        let hours = (diffMinutes - minutes) / 60;

        let hoursStr = hours <= 10 ? ('0' + hours).slice(-2) : ('' + hours);
        let minutesStr = ('0' + minutes).slice(-2);

        return (isDiffNegative ? '-':'') + (hoursStr + ':' + minutesStr);
    }

    exportHandler = () => {
        this.setState({
            exportingPDF: true
        });
    };

    convertHTMLtoPDF = (html, callback) => {
        axios.post('https://api.pdf.pyme.ch', {
            content: utils.wrapHtml(html, utils.capitalizeFirstLetter(
                window.moment(this.state.exportMonth + '_' + this.state.exportYear, 'M_YYYY').format('MMMM YYYY'))),
            download: true }).then(({ data }) => {
                if (data.result.error) {
                    console.log(data.result.error);
                    alert('Une erreur inconnue est survenue.');
                } else {
                    let link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = data.result.success.url;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    this.setState({ exportingPDF: false });
                    utils.notify.success({
                        title: "Votre fichier PDF a été téléchargé avec succès.",
                        stack: window.stackBottomRight,
                        delay: 2500
                    });
                }
        }).catch(err => {
            console.log(err);
            alert('Une erreur inconnue est survenue.');
        })
    }

    render() {
        let isWeekDiffNegative = this.state.weekDiff.startsWith('-');

        return (
            <Aux>
                <Row>
                    <Col>
                        { this.state.exportingPDF &&
                            <div className="d-none" id="export-result">
                                <Export month={this.state.exportMonth} year={this.state.exportYear} onFinished={() => {
                                    this.convertHTMLtoPDF(document.getElementById('export-result')
                                        .innerHTML.replace('d-none', ''), () => {
                                        this.setState({ exportingPDF: false });
                                    });
                                }}/>
                            </div>
                        }
                        <MainCard title="Statistiques des heures effectuées" path="/export" isOption parentContext={this}>
                            <Modal centered show={this.state.showExportModal}
                                   onHide={() => this.setState({ showExportModal: false })}>
                                <Modal.Header closeButton>
                                    <Modal.Title as="h5">Exporter le fichier PDF</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Row>
                                        <Col xs={6}>
                                            <select disabled={this.state.exportingPDF} className="form-control" defaultValue={this.state.exportMonth}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            exportMonth: Number(event.target.value)
                                                        }
                                                    )}
                                            }>
                                                { Array(12).fill('').map((item, index) =>
                                                    window.moment(index + 1, 'M').format('MMMM'))
                                                    .map((item, index) => (
                                                        <option key={'opt_' + index} value={index + 1}>
                                                            { utils.capitalizeFirstLetter(item) }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </Col>
                                        <Col xs={6}>
                                            <select disabled={this.state.exportingPDF} className="form-control" defaultValue={this.state.exportYear} onChange={(event) => {
                                                this.setState({ exportYear: Number(event.target.value) });
                                            }}>
                                                {[window.CURRENT_YEAR - 1, window.CURRENT_YEAR, window.CURRENT_YEAR + 1].map((item => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                )))}
                                            </select>
                                        </Col>
                                    </Row>
                                    { this.state.exportingPDF && <div className="text-center mt-4">
                                        <Spinner animation="border" variant="primary" />
                                    </div>}
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="primary" onClick={this.exportHandler}
                                            disabled={this.state.exportingPDF}>
                                        Exporter le fichier PDF
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                            <div>Cette semaine (depuis lundi) : { this.state.daysW }</div>
                            <div className="mb-3">
                                Heures restantes pour cette semaine :&nbsp;
                                <span className={(isWeekDiffNegative ? 'text-danger':'text-success')}>
                                    { this.state.weekDiff }
                                </span>
                            </div>
                            <div>7 derniers jours : { this.state.days7 }</div>
                            <div>14 derniers jours : { this.state.days14 }</div>
                            <div>30 derniers jours : { this.state.days30 }</div>
                            <div>60 derniers jours : { this.state.days60 }</div>
                        </MainCard>
                        <MainCard title="Jours de travail" path="/workdays" isOption parentContext={this}>
                            <Modal centered show={this.state.showAddModal}
                                   onHide={() => this.setState({ showAddModal: false })}>
                                <Modal.Header closeButton>
                                    <Modal.Title as="h5">Ajouter un nouveau jour de travail</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Datetime closeOnSelect timeFormat={false} defaultValue={this.state.addContent} dateFormat="dddd Do MMMM YYYY" inputProps={{placeholder: "Date du jour de travail" }}
                                              onChange={ event => this.setState({ addContent: event })}/>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="primary" onClick={this.addHandler}
                                            disabled={!(this.state.addContent._isAMomentObject && (window.WORKDAYS.filter(wd => wd.id === this.state.addContent.format('YYYY-MM-DD')).length === 0))}>
                                        Sauvegarder les modifications
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                            <Table ref="tbl" striped responsive bordered className="table table-condensed table-with-cursor-pointer" id="data-table-responsive">
                                <thead>
                                <tr>
                                    <th>Date du jour de travail</th>
                                    <th>Heures effectuées</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                            </Table>
                        </MainCard>
                    </Col>
                </Row>
            </Aux>
        );
    }
}

export default withRouter(DataTables);
