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

class Export extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            exportMonth: props.month,
            exportYear: props.year,
            exportData: false,
            totalHours: '00:00'
        };
    }

    componentDidMount() {
        utils.postData('/export', 'export')({
            month: this.state.exportMonth,
            year: this.state.exportYear
        }).then(({ data }) => {
            if ('error' in data.dbData) {
                alert('Une erreur inconnue est survenue.');
                console.log(data.dbData.error);
            } else {
                if (data.dbData.success === 'no data') return this.props.onFinished();
                let responses = data.dbData.success.Responses;
                let daysInfos = responses[Object.keys(responses)[0]];
                let diff = daysInfos.map(item => Number(item.workTime.N)).reduce((a, b) => a + b);

                let minutes = diff % 60;
                let hours = (diff - minutes) / 60;
                minutes = Math.abs(minutes);
                hours = Math.abs(hours);
                let hoursStr = hours <= 10 ? ('0' + hours).slice(-2) : ('' + hours);
                let minutesStr = ('0' + minutes).slice(-2);

                this.setState({ exportData: daysInfos, totalHours: hoursStr + ':' + minutesStr }, this.props.onFinished)
            }
        });
    }

    getTableContent = () => {
        if (!this.state.exportData) return <tbody/>
        return (
            <tbody>
            { this.state.exportData.sort((a, b) => a.id.S > b.id.S ? 1:-1).map(({ dayData, id }, indexDayData) => {
                let activeDayData = dayData.L.filter(item => !item.M.disabled).sort((a, b) =>
                    window.moment(a.M.begin.S, 'HH:mm') < window.moment(b.M.begin.S, 'HH:mm') ? -1:1);
                if (activeDayData.length <= 0) return null;
                return activeDayData.map((item, index) => (
                    <tr key={'activeDayData_' + indexDayData + '_' + index}>
                        { index === 0 &&
                        <td rowSpan={activeDayData.length}>
                            { window.moment(id.S).format('D MMMM') }
                        </td>
                        }
                        <td>{ item.M.begin.S }</td>
                        <td>{ item.M.end.S }</td>
                        <td>{ utils.getHoursDone({ begin: item.M.begin.S, end: item.M.end.S }).hoursDone}</td>
                        <td>{ utils.decodeStr(item.M.reason.S) }</td>
                    </tr>
                ));
            }) }
            </tbody>
        );
    };

    render() {
        return (
            <div>
                <div className="text-right">{ utils.getFirstname() + ' ' + utils.getLastname() }</div>
                <h4 className="text-center mb-3">
                    {(this.state.exportMonth === 'all' || !this.state.exportMonth) ? this.state.exportYear : utils.capitalizeFirstLetter(
                        window.moment(this.state.exportMonth + '_' + this.state.exportYear, 'M_YYYY').format('MMMM YYYY'))}
                </h4>
                <Table bordered>
                    <thead>
                    <tr>
                        <th>Jour</th>
                        <th>Début</th>
                        <th>Fin</th>
                        <th>Durée</th>
                        <th>Motif</th>
                    </tr>
                    </thead>
                    { this.getTableContent() }
                </Table>
                {(this.state.exportMonth === 'all' || !this.state.exportMonth) ? (
                    <div className="text-center">
                        Nombre total d'heures effectuées pour l'année {this.state.exportYear} : <strong>{this.state.totalHours}</strong>
                    </div>
                ):(
                    <div className="text-center">
                        Nombre total d'heures effectuées pour le mois {(['', 'de ', 'de ', 'de ', 'd\'', 'de ', 'de ',
                        'de ', 'd\'', 'de ', 'd\'', 'de ', 'de '])[this.state.exportMonth]}
                        {window.moment(this.state.exportMonth + '_' + this.state.exportYear, 'M_YYYY')
                            .format('MMMM YYYY')} : <strong>{this.state.totalHours}</strong>
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(Export);
