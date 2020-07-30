import React from 'react';
import {Row, Col, Card, Table, Modal, Button} from 'react-bootstrap';
import MainCard from '../App/components/MainCard';
import { withRouter } from 'react-router';

import Aux from '../hoc/_Aux';
import $ from 'jquery';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import utils from "../utils";
import Datetime from 'react-datetime';
import moment from 'moment'
import 'moment/locale/fr'; // without this line it didn't work
moment.locale('fr');
window.moment = moment;

window.jQuery = $;
window.$ = $;
global.jQuery = $;

$.DataTable = require('datatables.net-bs');
require('jszip');
require('pdfmake/build/pdfmake.js');
require('pdfmake/build/vfs_fonts.js');
require('datatables.net-autofill');
require('datatables.net-buttons-bs');
require('datatables.net-buttons/js/buttons.colVis.js');
require('datatables.net-buttons/js/buttons.flash.js');
require('datatables.net-buttons/js/buttons.html5.js');
require('datatables.net-buttons/js/buttons.print.js');
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
        currentData: {}
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
                alert('An unexpected error occured');
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
                utils.deleteData('/workdays')(currentId).then(({ data }) => {
                    if ('error' in data.dbData) {
                        alert('An unexpected error occured');
                        console.log(data.dbData.error);
                    }
                });
            })();
            context.registerActions();
        });
    };

    componentDidMount() {
        $.fn.dataTable.moment('MMMM Do YYYY, hh:mm');

        this.table = $('#data-table-responsive').DataTable( {
            data: window.WORKDAYS,
            order: [[ 0, "desc" ]],
            language: window.DT_TRANSLATION,
            columns: [
                { "data": "id", render: data => utils.capitalizeFirstLetter(moment(data).format('dddd Do MMMM YYYY')) },
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
    }

    render() {
        return (
            <Aux>
                <Row>
                    <Col>
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
