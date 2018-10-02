import React, { Component } from 'react';
import DetailList from './DetailList';

const io = require('socket.io-client');
const socket = io();

class Welcome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username:'',value:'', 
      isClerk: false, 
      isClerkFinal: false,
      auctionName: '',
      basePrice: 0.0,
      imageUrl: ''
    };
     
    this.handleChange = this.handleChange.bind(this);
    this.handleTick = this.handleTick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    // auction
    this.handleChangeAuctionName = this.handleChangeAuctionName.bind(this);
    this.handleChangeBasePrice = this.handleChangeBasePrice.bind(this);
    this.handleChangeImageUrl = this.handleChangeImageUrl.bind(this);
    this.handleSubmitAuction = this.handleSubmitAuction.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleTick(event) {
    if (this.state.isClerk)
      this.setState({isClerk: false});
    else {
      this.setState({isClerk: true});
    }
  }

  handleSubmit(event) {
    this.setState({username: this.state.value});
    if (this.state.isClerk)
      this.setState({isClerkFinal: true});
    else {
      this.setState({isClerkFinal: false});
    }
    event.preventDefault();
  }

  handleChangeAuctionName(event) {
    this.setState({auctionName: event.target.value});
  }

  handleChangeBasePrice(event) {
    this.setState({basePrice: event.target.value});
  }

  handleChangeImageUrl(event) {
    this.setState({imageUrl: event.target.value});
  }

  handleSubmitAuction(event) {
    this.props.createAuction({
      name: this.state.auctionName,
      basePrice: this.state.basePrice,
      image: this.state.imageUrl
    });
    event.preventDefault();
  }

  render() {
    const userName = this.state.username;
    const isClerkFinal = this.state.isClerkFinal;
    return (
      <div className="col-md-12">       
          <div className="row user-banner"> 
            {userName ==='' && !isClerkFinal ? (
              <div className="col-md-12  label-center"> 
                 <h3>Please Enter Your Name To Bid</h3>       
                  <form className="form-inline" onSubmit={this.handleSubmit}>
                    <div className="form-group mx-sm-3" >                                       
                      <input id="inputUsername" placeholder="User Name" className="form-control" type="text" value={this.state.value} onChange={this.handleChange} />
                      <label>
                          <input id="inputisCleark" className="form-control" type="checkbox" value={this.state.isClerk} onChange={this.handleTick} /> Are you clerk?
                      </label>                     
                    </div>
                    <input type="submit" className="btn btn-primary" value="Submit" />
                  </form>
                  
              </div>
              ):(
                <div className="col-md-12  label-center">  
                  {isClerkFinal ? (
                    <div>
                      <h2>HI! {userName} Welcome to Auction Man. You also can start an auction</h2>
                      <form className="form-inline" onSubmit={this.handleSubmitAuction}>
                        <div className="form-group mx-sm-3" >                                       
                          <input id="inputAuctionName" placeholder="User Name" className="form-control" type="text" value={this.state.auctionName} onChange={this.handleChangeAuctionName} />
                          <input id="inputBasePrice" placeholder="base price" className="form-control" type="number" value={this.state.basePrice} onChange={this.handleChangeBasePrice} />
                          <input id="inputImageUrl" placeholder="image url (optional)" className="form-control" type="text" value={this.state.imageUrl} onChange={this.handleChangeImageUrl} />
                        </div>
                        <input type="submit" className="btn btn-primary" value="Submit" />
                      </form>
                    </div>
                  ): <h2>HI! {userName} Welcome to Auction Man</h2>
                  }
                </div>
              )}
           
          </div>
         <div className="label-center">           
          </div>
      
         <div className="row">          
          <div className="col-md-12 product-detail-div"> 
            {/*<h3 className="label-center">LiveStock Available For Bidding</h3> */}
             {this.props.details.length !== 0 && 
             <DetailList data={this.props.details}  userName={userName} />
           }
          </div>
        </div>     
        
      </div>
    );
  }
}


export default Welcome;
