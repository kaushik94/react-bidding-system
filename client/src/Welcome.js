import React, { Component } from 'react';
import Pusher from 'pusher-js';

import DetailList from './DetailList';


import Modal from 'react-modal';
// Modal.setAppElement('.col-md-12')

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};


// roulette wheel
var options = ["$100", "$10", "$25", "$250", "$30", "$1000", "$1", "$200", "$45", "$500", "$5", "$20", "Lose", "$1000000", "Lose", "$350", "$5", "$99"];

var startAngle = 0;
var arc = Math.PI / (options.length / 2);
var spinTimeout = null;

var spinAngleStart = 0;
var spinTime = 0;
var spinTimeTotal = 0;

var ctx;


function byte2Hex(n) {
  var nybHexString = "0123456789ABCDEF";
  return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}

function RGB2Color(r,g,b) {
	return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function getColor(item, maxitem) {
  var phase = 0;
  var center = 128;
  var width = 127;
  var frequency = Math.PI*2/maxitem;
  
  var red   = Math.sin(frequency*item+2+phase) * width + center;
  var green = Math.sin(frequency*item+0+phase) * width + center;
  var blue  = Math.sin(frequency*item+4+phase) * width + center;
  
  return RGB2Color(red,green,blue);
}

function drawRouletteWheel(flushRouletteModal) {
  var canvas = document.getElementById("canvas");
  document.getElementById("spin").addEventListener("click", () => {
    spin(flushRouletteModal);
  });

  if (canvas.getContext) {
    var outsideRadius = 200;
    var textRadius = 160;
    var insideRadius = 125;

    ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,500,500);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.font = 'bold 12px Helvetica, Arial';

    for(var i = 0; i < options.length; i++) {
      var angle = startAngle + i * arc;
      //ctx.fillStyle = colors[i];
      ctx.fillStyle = getColor(i, options.length);

      ctx.beginPath();
      ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
      ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.shadowOffsetX = -1;
      ctx.shadowOffsetY = -1;
      ctx.shadowBlur    = 0;
      ctx.shadowColor   = "rgb(220,220,220)";
      ctx.fillStyle = "black";
      ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius, 
                    250 + Math.sin(angle + arc / 2) * textRadius);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      var text = options[i];
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      ctx.restore();
    } 

    //Arrow
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(250 - 4, 250 - (outsideRadius + 5));
    ctx.lineTo(250 + 4, 250 - (outsideRadius + 5));
    ctx.lineTo(250 + 4, 250 - (outsideRadius - 5));
    ctx.lineTo(250 + 9, 250 - (outsideRadius - 5));
    ctx.lineTo(250 + 0, 250 - (outsideRadius - 13));
    ctx.lineTo(250 - 9, 250 - (outsideRadius - 5));
    ctx.lineTo(250 - 4, 250 - (outsideRadius - 5));
    ctx.lineTo(250 - 4, 250 - (outsideRadius + 5));
    ctx.fill();
  }
}

function spin(flushRouletteModal) {
  spinAngleStart = Math.random() * 10 + 10;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3 + 4 * 1000;
  rotateWheel(flushRouletteModal);
}

function rotateWheel(flushRouletteModal) {
  spinTime += 30;
  if(spinTime >= spinTimeTotal) {
    stopRotateWheel(flushRouletteModal);
    return;
  }
  var spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawRouletteWheel();
  spinTimeout = setTimeout(() => { rotateWheel(flushRouletteModal) }, 30);
}

function stopRotateWheel(flushRouletteModal) {
  clearTimeout(spinTimeout);
  var degrees = startAngle * 180 / Math.PI + 90;
  var arcd = arc * 180 / Math.PI;
  var index = Math.floor((360 - degrees % 360) / arcd);
  ctx.save();
  ctx.font = 'bold 30px Helvetica, Arial';
  var text = options[index]
  ctx.fillText(text, 250 - ctx.measureText(text).width / 2, 250 + 10);
  ctx.restore();
  setTimeout(() => { flushRouletteModal() }, 1000);
}

function easeOut(t, b, c, d) {
  var ts = (t/=d)*t;
  var tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

class Welcome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username:'',value:'', 
      isClerk: false, 
      isClerkFinal: false,
      auctionName: '',
      basePrice: 0.0,
      imageUrl: '',
      modalIsOpen: false
    };
     
    this.handleChange = this.handleChange.bind(this);
    this.handleTick = this.handleTick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    // auction
    this.handleChangeAuctionName = this.handleChangeAuctionName.bind(this);
    this.handleChangeBasePrice = this.handleChangeBasePrice.bind(this);
    this.handleChangeImageUrl = this.handleChangeImageUrl.bind(this);
    this.handleSubmitAuction = this.handleSubmitAuction.bind(this);

    // roulette wheel
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    // this.subtitle.style.color = '#f00';
    var self = this;
    drawRouletteWheel(self.closeModal);
  }

  closeModal() {
    this.setState({modalIsOpen: false});
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
    this.setState({username: this.state.value}, () => {
      const that = this;
      const user = this.state.username;
      channel.bind('rouletteWheel', function(rouletteWheel) {
        console.log("pusher update", rouletteWheel, user);
        if (rouletteWheel.user == user) {
          that.openModal();
        }
      });
    });
    if (this.state.isClerk)
      this.setState({isClerkFinal: true});
    else {
      this.setState({isClerkFinal: false});
    }
    var pusher = new Pusher('4bfc58dae07dbdd74555', {
      cluster: 'ap2',
      forceTLS: true
    });
    var channel = pusher.subscribe('bidding-channel');
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

  // componentDidMount() {
  //   var that = this;
 
  // }

  render() {
    const userName = this.state.username;
    const isClerkFinal = this.state.isClerkFinal;
    return (
      <div className="col-md-12">
          <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.afterOpenModal}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Example Modal"
          >
            <canvas id="canvas" width="500" height="500"></canvas>
            <input type="button" value="spin" id='spin' />
          </Modal>       
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
