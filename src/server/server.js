import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const config = Config['localhost'];
const web3 = new Web3(config.url);
web3.eth.defaultAccount = web3.eth.accounts[0];

let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const statusCodes = [0, 10, 20, 30, 40, 50];
const oracleInitialIndex = config.oracleInitialIndex;
const oracleLasIndex = config.oracleLasIndex;
let oracleRegistered = false;


function getRandomStatus() {
  const randomIndex = Math.floor(Math.random() * 6);
  return statusCodes[randomIndex];
}

async function registerOracles() {
  const accounts = await web3.eth.getAccounts();
  const oracleFee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for(let a = oracleInitialIndex; a <= oracleLasIndex; a++) {      
    await flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: oracleFee, gas: config.gas, gasPrice: config.gasPrice });
    let result = await flightSuretyApp.methods.getOracle(accounts[a]).call();
    console.log(`Oracle registred: ${result[0]}, ${result[1]}, ${result[2]}`);
  }
  oracleRegistered = true;
}


flightSuretyApp.events.OracleRequest({
    fromBlock: 0  
  }, async function (error, event) {
    if (oracleRegistered) {
      if (error) {
        console.log(error);
      } else {
        const accounts = await web3.eth.getAccounts();
        const flightStatus = getRandomStatus();
        const index = event.returnValues.index;
        const airline = event.returnValues.airline;
        const flight = event.returnValues.flight;
        const timestamp = event.returnValues.timestamp;

        for(let a = oracleInitialIndex; a <= oracleLasIndex; a++) {
          let result = await flightSuretyApp.methods.getOracle(accounts[a]).call();
          for (let i = 0; i < result.length; i++) {
            if (result[i] == index) {
              await flightSuretyApp.methods
                  .submitOracleResponse(index, airline, flight, timestamp, flightStatus)
                  .send({from: accounts[a], gas: config.gas, gasPrice: config.gasPrice});
            }
          }
        }
      }
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

registerOracles().then(() => {
  console.log("** registerOracles called **");
}).catch(error => {
  console.log("Error: " + error);
});

export default app;


