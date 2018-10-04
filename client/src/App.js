import React, { Component } from 'react';
import Pusher from 'pusher-js';


import 'bootstrap/dist/css/bootstrap.css';
import Welcome from './Welcome';
import './App.css';


// const io = require('socket.io-client');
// const socket = io();

class App extends Component {

  constructor() {
    super();


  // Initialize state
    this.state = {
      details:[],
      bidHistory:[],
    }

  }

  // Fetch asset Details after first mount
  componentDidMount() {
    this.getDetails();
    var that = this;
    var pusher = new Pusher('4bfc58dae07dbdd74555', {
      cluster: 'ap2',
      forceTLS: true
    });
    var channel = pusher.subscribe('bidding-channel');
    channel.bind('newAuction', function(newAuction) {
      console.log("pusher update", newAuction);
      that.setState({details: newAuction})
    }); 
  }

  getDetails = () => {
    // Get the asset Details and store them in state
    fetch('/api/details')
      .then(res => res.json())
      .then(details => this.setState({details}));
  }

  createAuction = (auction) => {
    fetch('/api/auction',{method:"POST",headers: new Headers({'content-type':'application/json'}), dataType:'json', body:JSON.stringify(auction)})
     .then(res => res.json())
     .then(details => this.setState({details}));
  }

  render() {
    return (
      <div className="App container-fluid">
        <div className = "row nav-bar">
          <div className = "col-md-12 app-title"><h1>Auction man</h1></div>
        </div>
        <div>
        </div>
        <div className = "row">          
            <Welcome details = {this.state.details} createAuction={this.createAuction} />          
        </div>
      </div>     
    );
  }
}

export default App;
