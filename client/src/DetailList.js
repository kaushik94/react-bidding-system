import React, { Component } from 'react';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import Image from 'react-bootstrap/lib/Image';
import BidHistory from './BidHistory';
import BidTimer from './BidTimer';

import Pusher from 'pusher-js';

const decideAlertOnBid = (self, bidObj, cb) => {
  var message;
  for (var asset in bidObj) {
    for (var bidder in bidObj[asset]) {
      const bid = bidObj[asset][bidder];
      if (!self.state.bidHistory[asset].hasOwnProperty(bidder)) {
        if (self.state.bidHistory[asset][self.props.userName] < bidObj[asset][bidder]) {
          console.log("bid more", self.props.userName, self.state.bidHistory[asset][self.props.userName], bidder, bidObj[asset][bidder])
          message = `${bidder} just outbid you with ${bid}` 
          NotificationManager.info('Get clubbing', message);
        }
      } else {
        if (self.state.bidHistory[asset][bidder] < bidObj[asset][bidder] &&
          self.state.bidHistory[asset][self.props.userName] < bidObj[asset][bidder]) {
            message = `${bidder} just outbid you with ${bid}`
            NotificationManager.info('Get clubbing', message); 
            console.log("bid more", self.props.userName, self.state.bidHistory[asset][self.props.userName], bidder, bidObj[asset][bidder])
          }
      }
    }
  }
  cb();
}

class DetailList extends Component {
  constructor(props) {
    super(props);
    this.state = {bidHistory:[],timeRemain:0, timeRemaining:{}} 
  } 

   //Fetch bidHistory after first mount
  componentDidMount() { 
    this.getBidHistory();
    this.getTimeRemaining();
    var self = this;
    Pusher.logToConsole = true;

    var pusher = new Pusher('4bfc58dae07dbdd74555', {
      cluster: 'ap2',
      forceTLS: true
    });

    var channel = pusher.subscribe('bidding-channel');
    channel.bind('updateBid', function(bidObj) {
      console.log("pusher update", bidObj);
      decideAlertOnBid(self, bidObj.bids, () => {
        self.setState({bidHistory:bidObj.bids});
      })
    });
  }

  getTimeRemaining = () => {
    fetch('/api/time')
      .then(res => res.json())
      .then(timeRemaining => this.setState({timeRemaining}))
  }

  getBidHistory = () => {
    // Get the bidhistory and store them in state
    fetch('/api/bidhistory')
      .then(res => res.json())
      .then(bidHistory => this.setState({bidHistory}));
  }

  saveBid(bidhistory, liveStockID, newBid) { 
    this.state.bidHistory[liveStockID] = bidhistory;
    // Save the  bidHistory  
    fetch('/api/bidhistory',{method:"POST",headers: new Headers({'content-type':'application/json'}), dataType:'json', body:JSON.stringify([this.state.bidHistory, newBid])})
     .then(res => res.json())
     .then(bidhistory => this.setState({bidhistory}));

  }

  render() {
    var self = this;
  	var detailsNodes = this.props.data.map(function(details) {
      //map the data to individual details
       var bidSort;
       if(Object.keys(self.state.bidHistory).length !== 0) {
         self.bidHistoryObj = self.state.bidHistory[details.id];
         console.log(self.bidHistoryObj)       
         bidSort = Object.keys(self.bidHistoryObj)
                              .sort((a,b) =>self.bidHistoryObj[b]-self.bidHistoryObj[a])
                              .reduce((obj, key)=>({...obj, [key]: self.bidHistoryObj[key]}), {});
       }      
      return (
        <Details
          name={details.name}
          key = {details.id} 
          id ={details.id}
          basePrice={details.basePrice}
          image={details.image}
          bidHistory = {bidSort}  
          saveBid = {self.saveBid.bind(self)}
          userName = {self.props.userName}
          timeFromServer = {self.state.timeRemaining[details.id]}      

        >
         
        </Details>
      );
    });
    //print all the deatils in the list
    return (
      <div className = "detailsList">
       {this.state.bidHistory.length !== 0 &&
          <div className="row">          
            {detailsNodes}         
          </div>
         }
      </div>
    );
  }
}


class Details extends Component {
  constructor(props) {
    super(props);
    this.state = {bidPrice:'',inputValue:'', showBidInput: true};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({inputValue: event.target.value});
  }

  handleSubmit(event) {    
    //this.setState({bidPrice: this.state.inputValue});  
    var bidHistoryObj = this.props.bidHistory;
    bidHistoryObj[this.props.userName] = this.state.inputValue;
    event.preventDefault();
    const newBid = {
      id: this.props.id,
      user: this.props.userName,
      bid: this.state.inputValue
    };
    
    this.props.saveBid(bidHistoryObj,this.props.id, newBid);
    this.setState({showBidInput:false});

  }

  reBid(event) {
    this.setState({showBidInput:true});
  }

   render() {
    // const imgUrl = require(`./assets/${this.props.image}`);
    const imgUrl = this.props.image;
    //display an individual Asset Detail
    return (
      <div className="col-md-4">
        <div className="bid-detail-div">
          <div className="row">
            <div className="col-md-12">
              <Image src={imgUrl} width="275" height="183" rounded />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 ">
              <div>
                <div className="livestock-info">
                  <h5>{this.props.name} - {this.props.id}</h5>
                  <h5>Base Price - ${this.props.basePrice}</h5>
                   {this.props.timeFromServer > 0 &&
                     <BidTimer timeFromServer={this.props.timeFromServer}/>
                   }
                   {this.props.timeFromServer < 0 &&
                     <h5>SOLD</h5>
                   }
                </div>
                {this.props.userName !=='' && 
                  <div>
                    {this.state.showBidInput ?(
                    <form className="form-inline bid-form" onSubmit={this.handleSubmit}> 
                      {this.props.timeFromServer >0 &&
                        <div>
                          <div className="form-group mx-sm-3" >                  
                            <input id="inputBid" className="form-control" type="number" placeholder="Your Price" min={this.props.basePrice} value={this.state.inputValue} onChange={this.handleChange} />                  
                          </div>
                        <input type="submit" className="btn btn-primary bid-submit-btn" value="Bid" />
                      </div>
                       }
                    </form>
                    ):(
                      <input type="button" className="btn btn-primary rebid-input" value="ReBid" onClick={this.reBid.bind(this)}/>
                    )
                   }
                   
                  </div>
                }
              </div>
            </div>       
          </div>
          <div className = "row bid-history-div">
            {Object.keys(this.props.bidHistory).length > 0 &&
              <div>
                <h4 className="bid-history-header ">Bid History</h4>
                <BidHistory bidHistory={this.props.bidHistory} ></BidHistory>
              </div>
             }
          </div>
        </div>
        <NotificationContainer/>
      </div>
    );

   }

}



export default DetailList;