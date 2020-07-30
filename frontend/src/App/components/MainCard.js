import React, {Component} from 'react';
import {Dropdown, Card, Collapse, Button} from 'react-bootstrap';
import windowSize from 'react-window-size';

import Aux from "../../hoc/_Aux";
import DEMO from "../../store/constant";
import utils from "../../utils";

class MainCard extends Component {
    state = {
        isOption: this.props.isOption,
        fullCard: false,
        collapseCard: false,
        loadCard: false,
        cardRemove: false,
    };

    render() {
        let fullScreenStyle, loader, cardHeaderRight, cardHeader;
        let card = '';
        let cardClass = [];

        if (this.state.isOption) {
            cardHeaderRight = (
                <div className="card-header-right">
                    <Dropdown alignRight={true} className="btn-group card-option">
                        { this.props.hasOwnProperty('path') ? (
                            <Button className="btn-icon btn-card-plus mr-1"
                                    style={{ borderTopRightRadius: '50%', borderBottomRightRadius: '50%' }}
                                    onClick={ () => {
                                        if (this.props.path === '/day') {
                                            this.props.parentContext.setState({ showAddModal: true, currentData: {
                                                begin: window.moment(),
                                                end: '',
                                                reason: ''
                                            }});
                                        } else {
                                            this.props.parentContext.setState({ showAddModal: true, addContent: window.moment() });
                                        }
                                    }}>
                                <i className="feather icon-plus"/>
                            </Button>
                        ):null}
                        <Dropdown.Toggle id="dropdown-basic" className="btn-icon icon-card-expand d-none">
                            <i className="feather icon-more-horizontal"/>
                        </Dropdown.Toggle>
                        <Dropdown.Menu as='ul' className="list-unstyled card-option">
                            <Dropdown.Item as='li' className="dropdown-item"
                                           onClick={() => this.setState(prevState => ({ fullCard: !prevState.fullCard }))}>
                                <i className={this.state.fullCard ? 'feather icon-minimize' : 'feather icon-maximize'}/>
                                <a href={DEMO.BLANK_LINK}> {this.state.fullCard ? 'Restore' : 'Maximize'} </a>
                            </Dropdown.Item>
                            <Dropdown.Item as='li' className="dropdown-item"
                                           onClick={() => this.setState(prevState => ({collapseCard: !prevState.collapseCard }))}>
                                <i className={this.state.collapseCard ? 'feather icon-plus' : 'feather icon-minus'}/>
                                <a href={DEMO.BLANK_LINK}> {this.state.collapseCard ? 'Expand' : 'Collapse'} </a>
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            );
        }

        cardHeader = (
            <Card.Header>
                <Card.Title as='h5'>{this.props.title}</Card.Title>
                {cardHeaderRight}
            </Card.Header>
        );

        if (this.state.fullCard) {
            cardClass = [...cardClass, 'full-card'];
            fullScreenStyle = {position: 'fixed', top: 0, left: 0, right: 0, width: this.props.windowWidth, height: this.props.windowHeight};
        }

        if (this.state.loadCard) {
            cardClass = [...cardClass, 'card-load'];
            loader = (
                <div className="card-loader">
                    <i className="pct-loader1 anim-rotate"/>
                </div>
            );
        }

        if (this.state.cardRemove) {
            cardClass = [...cardClass, 'd-none'];
        }

        if (this.props.cardClass) {
            cardClass = [...cardClass, this.props.cardClass];
        }

        card = (
            <Card className={cardClass.join(' ')} style={fullScreenStyle}>
                {cardHeader}
                <Collapse in={!this.state.collapseCard}>
                    <div>
                        <Card.Body>
                            {this.props.children}
                        </Card.Body>
                    </div>
                </Collapse>
                {loader}
            </Card>
        );

        return (
            <Aux>
                {card}
            </Aux>
        );
    }
}

export default windowSize(MainCard);
