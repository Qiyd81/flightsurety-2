import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(config.url);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.appAddress = config.appAddress;
        this.firstAirline = config.firstAirline;
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.gas = config.gas;
        this.gasPrice = config.gasPrice
    }

    initialize(callback) {
        let self = this;
        self.web3.eth.getAccounts((error, accts) => {
           
            self.owner = accts[0];

            let counter = 1;
            
            while(self.airlines.length < 5) {
                self.airlines.push(accts[counter++]);
            }

            while(self.passengers.length < 5) {
                self.passengers.push(accts[counter++]);
            }

            callback();
        });

    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    authorizeCaller(callback) {
        let self = this;
        let payload = {
            appContractOwner: self.owner,
            authorized: true
        }
        self.flightSuretyData.methods
            .authorizeCaller(self.appAddress)
            .send({ from: payload.appContractOwner }, (error, result) => {
                callback(error, payload);
            });
    }

    addAirline(newAirline, name, callback) {
        let self = this;
        let payload = {
            newAirline: newAirline,
            name: name
        } 
        self.flightSuretyApp.methods
            .addAirline(payload.newAirline, payload.name)
            .send({ from: self.firstAirline, gas: self.gas, gasPrice: self.gasPrice }, (error, result) => {
                callback(error, payload);
            });
    }

    vote(airline, applicantAirline, callback) {
        let self = this;
        let payload = {
            airline: airline,
            applicantAirline: applicantAirline
        } 
        self.flightSuretyApp.methods
            .vote(payload.applicantAirline)
            .send({ from: payload.airline, gas: self.gas, gasPrice: self.gasPrice }, (error, result) => {
                callback(error, payload);
            });
    }

    fund(airline, amount, callback) {
        let self = this;
        let payload = {
            airline: airline,
            // amount: web3.toWei(amount, "ether")
            amount: amount
        } 
        self.flightSuretyApp.methods
            .fund()
            .send({ from: payload.airline, value: payload.amount }, (error, result) => {
                callback(error, payload);
            });
    }

    buy(airline, flight, timestamp, insuree, value, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp,
            insuree: insuree,
            value: value
        } 
        self.flightSuretyApp.methods
            .buy(payload.airline, payload.flight, payload.timestamp)
            .send({ from: payload.insuree, value: payload.value }, (error, result) => {
                callback(error, payload);
            });
    }

    credit(insuree, callback) {
        let self = this;

        self.flightSuretyApp.methods
            .getInsureeBalance(insuree)
            .call( (error, result) => {
                callback(error, result);
            });

    }

    withdraw(insuree, callback) {
        let self = this;
        let payload = {
            passenger: insuree
        } 
        self.flightSuretyApp.methods
            .withdraw()
            .send({ from: payload.passenger, gas: self.gas, gasPrice: self.gasPrice }, (error, result) => {
                callback(error, payload);
            });
            // .send({ from: payload.passenger }, (error, result) => {
            //     callback(error, payload);
            // });
    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

}