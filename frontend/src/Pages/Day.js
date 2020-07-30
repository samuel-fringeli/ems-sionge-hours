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
import 'moment/locale/fr';
import Loader from "../App/layout/Loader"; // without this line it didn't work
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

    constructor(props) {
        super(props);

        let state = {
            addContent: false,
            pageLoaded: false,
            showAddModal: false,
            showEditModal: false,
            dayWorkTime: '00:00',
            currentData: {
                begin: window.moment(),
                end: window.moment(),
                reason: ''
            }
        };

        if (props.location.search === '') {
            props.history.push('/workdays');
        } else {
            state.dayId = props.location.search.replace('?id=', '');
        }

        this.state = state;
    }

    deleteConfirmHandler = executeIfYes => () => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: 'Êtes-vous sûr?',
            text: 'Cette action est irréversible.',
            type: 'warning',
            showCloseButton: true,
            showCancelButton: true
        }).then((willDelete) => willDelete.value ? executeIfYes() : null);
    };

    addHandler = () => {
        let newForm = {
            begin: this.state.currentData.begin._isAMomentObject ? this.state.currentData.begin.format('HH:mm') : '',
            end: this.state.currentData.end._isAMomentObject ? this.state.currentData.end.format('HH:mm') : '',
            reason: utils.encodeStr(this.state.currentData.reason)
        }; // begin, end, reason
        let newId = window.CURRENT_DAY.length === 0 ? 0 : +window.CURRENT_DAY.reduce(
                (a, b) => (+a.id.replace('data', '') > +b.id.replace('data', '')) ? a:b).id.replace('data', '') + 1;
        newForm.id = 'data' + newId;
        window.CURRENT_DAY.push(newForm);
        this.calculateHoursDone();
        $('#data-table-responsive').DataTable().row.add(window.CURRENT_DAY[window.CURRENT_DAY.length - 1]).draw();
        this.registerActions();
        this.setState({ showAddModal: false, dayWorkTime: this.getDayWorkTime() });
        utils.postData('/day', 'add')({
            ...newForm, dayId: this.state.dayId
        }).then(({ data }) => {
            if ('error' in data.dbData) {
                alert('An unexpected error occured');
                console.log(data.dbData.error);
            }
        });
    };

    editHandler = () => {
        let newDataIndex = window.CURRENT_DAY.findIndex(item => item.id === this.state.currentData.id);
        window.CURRENT_DAY[newDataIndex].begin = this.state.currentData.begin._isAMomentObject ? this.state.currentData.begin.format('HH:mm') : '';
        window.CURRENT_DAY[newDataIndex].end = this.state.currentData.end._isAMomentObject ? this.state.currentData.end.format('HH:mm') : '';
        window.CURRENT_DAY[newDataIndex].reason = utils.encodeStr(this.state.currentData.reason);
        this.calculateHoursDone();

        let row = this.table.row($('#edit-' + window.CURRENT_DAY[newDataIndex].id).parents('tr'));
        row.data(window.CURRENT_DAY[newDataIndex]).draw();
        this.setState({ showEditModal: false, dayWorkTime: this.getDayWorkTime() });
        this.registerActions();

        utils.postData('/day', 'editDayContent')({
            dayId: this.state.dayId,
            id: window.CURRENT_DAY[newDataIndex].id,
            begin: window.CURRENT_DAY[newDataIndex].begin,
            end: window.CURRENT_DAY[newDataIndex].end,
            reason: window.CURRENT_DAY[newDataIndex].reason
        }).then(({ data }) => {
            if ('error' in data.dbData) {
                alert('An unexpected error occured');
                console.log(data.dbData.error);
            }
        });
    };

    registerActions = () => {
        let context = this;

        let editBtn = $('#data-table-responsive .btn-edit-form');
        let removeBtn = $('#data-table-responsive .btn-remove-form');

        editBtn.off('click');
        removeBtn.off('click');

        editBtn.on('click', function() {
            let currentData = window.CURRENT_DAY.filter(item => item.id === this.id.split('edit-')[1])[0];
            context.setState({ showEditModal: true, currentData: {
                begin: window.moment(currentData.begin, 'HH:mm'),
                end: window.moment(currentData.end, 'HH:mm'),
                reason: currentData.reason,
                id: currentData.id
            }});
        });

        removeBtn.on('click', function () {
            context.deleteConfirmHandler(() => {
                let currentId = this.id.split('remove-')[1];
                let rowIdx = window.CURRENT_DAY.findIndex(item => item.id === currentId);
                let row = context.table.row($(this).parents('tr'));
                row.remove().draw();
                window.CURRENT_DAY.splice(rowIdx, 1);
                context.setState({ dayWorkTime: context.getDayWorkTime() });
                utils.deleteData('/day')(currentId, context.state.dayId).then(({ data }) => {
                    if ('error' in data.dbData) {
                        alert('An unexpected error occured');
                        console.log(data.dbData.error);
                    }
                });
            })();
            context.registerActions();
        });
    };

    getDayWorkTime() {
        this.calculateHoursDone();
        let diff = 0;
        if (window.CURRENT_DAY.length > 0) {
            diff = window.CURRENT_DAY.map(item => item.minDone).reduce((a, b) => a + b);
        }
        let minutes = diff % 60;
        let hours = (diff - minutes) / 60;
        minutes = Math.abs(minutes);
        hours = Math.abs(hours);
        let hoursStr = ('0' + hours).slice(-2);
        let minutesStr = ('0' + minutes).slice(-2);
        return hoursStr + ':' + minutesStr;
    }

    getHoursDone(item) {
        let begin = moment(item.begin, 'HH:mm');
        let end = moment(item.end, 'HH:mm');
        if (begin.format() === "Invalid date" || end.format() === "Invalid date") {
            return { hoursDone: '00:00', minDone: 0 };
        }
        let diff = begin.diff(end, 'minutes');
        let minutes = diff % 60;
        let hours = (diff - minutes) / 60;
        minutes = Math.abs(minutes);
        hours = Math.abs(hours);
        let hoursStr = ('0' + hours).slice(-2);
        let minutesStr = ('0' + minutes).slice(-2);
        return {
            hoursDone: hoursStr + ':' + minutesStr,
            minDone: Math.abs(diff)
        };
    }

    calculateHoursDone() {
        window.CURRENT_DAY = window.CURRENT_DAY
            .filter(item => !('disabled' in item && item.disabled === 'true'))
            .map(item => ({
                ...item,
                ...this.getHoursDone(item),
            })
        );
    }

    async componentDidMountAsync() {
        if (this.state.pageLoaded === false) {
            let splitted_url = window.location.href.split('?id=');
            if (splitted_url.length > 1) {
                let date = splitted_url[1];
                let data;
                try {
                    data = (await utils.getData('/day?id=' + date)).data;
                } catch(e) {
                    this.props.history.push('/workdays');
                }
                let item;
                try {
                    item = data.dbData.success.Item.dayData;
                } catch (e) {
                    this.props.history.push('/workdays');
                }
                window.CURRENT_DAY = item;
            } else {
                this.props.history.push('/workdays');
            }
        }

        await new Promise(resolve => this.setState({ pageLoaded: true, dayWorkTime: this.getDayWorkTime() }, resolve));

        $.fn.dataTable.moment('MMMM Do YYYY, hh:mm');

        this.calculateHoursDone();
        this.table = $('#data-table-responsive').DataTable( {
            data: window.CURRENT_DAY,
            order: [[ 0, "asc" ]],
            language: window.DT_TRANSLATION,
            columns: [
                { "data": "begin", render: data => data },
                { "data": "end", render: data => data },
                { "data": "hoursDone", render: data => data },
                { "data": "reason", render: data => data },
                { "data": "dayActions", render: (data, type, row) =>
                    '<div class="actionsHtml">' +
                    '<span class="btn btn-sm btn-primary ml-2 btn-edit-form" id="edit-' + row.id + '">' +
                    '<i class="feather icon-edit-2"></i>' +
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

    isSaveDisabled = () => {
        let { begin, end, reason } = this.state.currentData;

        if (begin._isAMomentObject && begin._i === '') begin = '';
        if (end._isAMomentObject && end._i === '') end = '';

        if (begin === '' && end === '' && reason === '') return true;

        if (begin._isAMomentObject && begin.format() === 'Invalid date') return true;
        if (end._isAMomentObject && end.format() === 'Invalid date') return true;

        if (!begin._isAMomentObject && begin !== '') return true;
        if (!end._isAMomentObject && end !== '') return true;

        if (begin._isAMomentObject && end._isAMomentObject) {
            if (begin.diff(end, 'minutes') > 0) return true;
        }

        return false;
    }; /*
        !(
            (!(
                (this.state.currentData.begin === ''
                    || (this.state.currentData.begin._isAMomentObject
                        && this.state.currentData.format() === 'Invalid date'))
                && (this.state.currentData.end === ''
                    || (this.state.currentData.end._isAMomentObject
                        && this.state.currentData.end.format() === 'Invalid date'))
                && this.state.currentData.reason === ''
            )) && (
                (this.state.currentData.begin === ''
                    || this.state.currentData.begin._isAMomentObject
                ) && (
                    this.state.currentData.end === ''
                    || this.state.currentData.end._isAMomentObject
                ) && (
                    (this.state.currentData.begin === ''
                        || (this.state.currentData.begin._isAMomentObject
                            && this.state.currentData.format() === 'Invalid date'))
                    && (this.state.currentData.end === ''
                        || (this.state.currentData.end._isAMomentObject
                            && this.state.currentData.end.format() === 'Invalid date'))
                    || (
                        this.state.currentData.begin.diff(this.state.currentData.end) <= 0
                    )
                )
            )
        );*/

    componentDidMount() {
        this.componentDidMountAsync();
    }

    render() {
        if (this.state.pageLoaded === false) {
            return <Loader/>
        }
        return (
            <Aux>
                <Row>
                    <Col>
                        <MainCard title={ utils.capitalizeFirstLetter(window.moment(this.state.dayId).format('dddd Do MMMM YYYY')) + ' (' + this.state.dayWorkTime + ' de travail)' } path="/day" isOption parentContext={this}>
                            <Modal centered show={this.state.showEditModal}
                                   onHide={() => this.setState({ showEditModal: false })}>
                                <Modal.Header closeButton>
                                    <Modal.Title as="h5">Editer le temps de travail</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Row>
                                        <Col xs="12" sm="6" className="mb-2">
                                            <Datetime dateFormat={false}
                                                      value={this.state.currentData.begin._isAMomentObject ?
                                                          this.state.currentData.begin.format() === 'Invalid date' ?
                                                              '':this.state.currentData.begin.format('HH:mm'):this.state.currentData.begin}
                                                      onChange={begin => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          begin
                                                      }})}
                                                      inputProps={{placeholder: 'Début'}}
                                                      className="datetime-input-edit-begin"
                                                      renderInput={(props) =>
                                                          <Row>
                                                              <Col className="pr-0">
                                                                  <input {...props} />
                                                              </Col>
                                                              <Col xs="auto" className="pl-0">
                                                                  <Button variant="light" className="pl-2 pr-2 pt-2 pb-2 mt-1"
                                                                          onClick={(event) => {
                                                                              this.setState({ currentData: {
                                                                                  ...this.state.currentData,
                                                                                  begin: window.moment()
                                                                              }})
                                                                          }}>
                                                                      <i className="feather icon-rotate-ccw"/>
                                                                  </Button>
                                                              </Col>
                                                          </Row>
                                                      }
                                            />
                                        </Col>
                                        <Col xs="12" sm="6">
                                            <Datetime dateFormat={false}
                                                      value={this.state.currentData.end._isAMomentObject ?
                                                          this.state.currentData.end.format() === 'Invalid date' ?
                                                              '':this.state.currentData.end.format('HH:mm'):this.state.currentData.end}
                                                      inputProps={{placeholder: 'Fin'}}
                                                      className="datetime-input-edit-end"
                                                      renderInput={(props) =>
                                                          <Row>
                                                              <Col className="pr-0">
                                                                  <input {...props} />
                                                              </Col>
                                                              <Col xs="auto" className="pl-0">
                                                                  <Button variant="light" className="pl-2 pr-2 pt-2 pb-2 mt-1"
                                                                          onClick={(event) => {
                                                                              this.setState({ currentData: {
                                                                                      ...this.state.currentData,
                                                                                      end: window.moment()
                                                                                  }})
                                                                          }}>
                                                                      <i className="feather icon-rotate-ccw"/>
                                                                  </Button>
                                                              </Col>
                                                          </Row>
                                                      }
                                                      onChange={end => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          end
                                                      }})}/>
                                        </Col>
                                        <Col xs="12">
                                            <textarea placeholder="Motif" className="form-control mt-1"
                                                      defaultValue={utils.decodeStr(this.state.currentData.reason)}
                                                      onChange={event => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          reason: event.target.value
                                                      }})}/>
                                        </Col>
                                    </Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="primary" onClick={this.editHandler} disabled={this.isSaveDisabled()}>Sauvegarder les modifications</Button>
                                </Modal.Footer>
                            </Modal>
                            <Modal centered show={this.state.showAddModal}
                                   onHide={() => this.setState({ showAddModal: false })}>
                                <Modal.Header closeButton>
                                    <Modal.Title as="h5">Ajouter un nouveau temps de travail</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Row>
                                        <Col xs="12" sm="6" className="mb-2">
                                            <Datetime dateFormat={false}
                                                      value={this.state.currentData.begin._isAMomentObject ?
                                                          this.state.currentData.begin.format() === 'Invalid date' ?
                                                              '':this.state.currentData.begin.format('HH:mm'):this.state.currentData.begin}
                                                      onChange={begin => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          begin
                                                      }})}
                                                      renderInput={(props) =>
                                                          <Row>
                                                              <Col className="pr-0">
                                                                  <input {...props} />
                                                              </Col>
                                                              <Col xs="auto" className="pl-0">
                                                                  <Button variant="light" className="pl-2 pr-2 pt-2 pb-2 mt-1"
                                                                          onClick={(event) => {
                                                                              this.setState({ currentData: {
                                                                                      ...this.state.currentData,
                                                                                      begin: window.moment()
                                                                                  }})
                                                                          }}>
                                                                      <i className="feather icon-rotate-ccw"/>
                                                                  </Button>
                                                              </Col>
                                                          </Row>
                                                      }
                                                      className="datetime-input-add-begin"
                                                      inputProps={{placeholder: 'Début'}} />
                                        </Col>
                                        <Col xs="12" sm="6">
                                            <Datetime dateFormat={false}
                                                      value={this.state.currentData.end._isAMomentObject ?
                                                          this.state.currentData.end.format() === 'Invalid date' ?
                                                              '':this.state.currentData.end.format('HH:mm'):this.state.currentData.end}
                                                      className="datetime-input-add-end"
                                                      inputProps={{placeholder: 'Fin'}}
                                                      renderInput={(props) =>
                                                          <Row>
                                                              <Col className="pr-0">
                                                                  <input {...props} />
                                                              </Col>
                                                              <Col xs="auto" className="pl-0">
                                                                  <Button variant="light" className="pl-2 pr-2 pt-2 pb-2 mt-1"
                                                                          onClick={(event) => {
                                                                              this.setState({ currentData: {
                                                                                      ...this.state.currentData,
                                                                                      end: window.moment()
                                                                                  }})
                                                                          }}>
                                                                      <i className="feather icon-rotate-ccw"/>
                                                                  </Button>
                                                              </Col>
                                                          </Row>
                                                      }
                                                      onChange={end => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          end
                                                      }})}/>
                                        </Col>
                                        <Col xs="12">
                                            <textarea placeholder="Motif" className="form-control mt-1"
                                                      defaultValue={utils.decodeStr(this.state.currentData.reason)}
                                                      onChange={event => this.setState({ currentData: {
                                                          ...this.state.currentData,
                                                          reason: event.target.value
                                                      }})}/>
                                        </Col>
                                    </Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="primary" onClick={this.addHandler} disabled={this.isSaveDisabled()}>
                                        Sauvegarder les modifications
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                            <Table ref="tbl" striped responsive bordered className="table table-condensed table-with-cursor-pointer" id="data-table-responsive">
                                <thead>
                                <tr>
                                    <th>Heure de début</th>
                                    <th>Heure de fin</th>
                                    <th>Heures effectuées</th>
                                    <th>Motif</th>
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
