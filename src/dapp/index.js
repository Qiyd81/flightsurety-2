
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            status('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    
        contract.authorizeCaller((error, result) => {
            console.log(error,result);
            status('Authorization Status', 'Check if contract is authorized', [ { label: 'Authorization Status', error: error, value: result.authorized} ]);
        });

        // User-submitted transaction
        DOM.elid('submit-funds').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;
            let fundValue = DOM.elid('fund-value').value;
            // Write transaction
            contract.fund(airlineAddress, fundValue, (error, result) => {
                log('Airline', 'Add Funds', [ { label: 'Add Funds Status', error: error, value: result.airline + ' ' + result.amount } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-airline').addEventListener('click', () => {
            let newAirlineAddress = DOM.elid('new-airline-address').value;
            let newAirlineName = DOM.elid('new-airline-name').value;
            // Write transaction
            contract.addAirline(newAirlineAddress, newAirlineName, (error, result) => {
                log('Airline', 'Add Airline', [ { label: 'New Airline Status', error: error, value: result.name } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-vote').addEventListener('click', () => {
            let voterAirlineAddress = DOM.elid('voter-airline-address').value;
            let applicantAirlineAddress = DOM.elid('applicant-airline-address').value;
            // Write transaction
            contract.vote(voterAirlineAddress, applicantAirlineAddress, (error, result) => {
                log('Airline', 'Vote Airline', [ { label: 'Vote Airline', error: error, value: result.applicantAirline } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-buy').addEventListener('click', () => {
            let flightAirlineAddress = DOM.elid('flight-airline-address').value;
            let flightNumber = DOM.elid('flight-number').value;
            let timestamp = DOM.elid('timestamp').value;
            let passengerAddress = DOM.elid('passenger-address').value;
            let insuranceValue = DOM.elid('insurance-value').value;
            // Write transaction
            contract.buy(flightAirlineAddress, flightNumber, timestamp, passengerAddress, insuranceValue, (error, result) => {
                log('Flight', 'Buy insurance', [ { label: 'Buy insurance', error: error, value: result.insuree + ' ' + result.value } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-credit').addEventListener('click', () => {
            let passengerAddress = DOM.elid('withdraw-passenger-address').value;
            // Write transaction
            contract.credit(passengerAddress, (error, result) => {
                log('Passenger', 'Read credit', [ { label: 'Credit', error: error, value: result } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-withdraw').addEventListener('click', () => {
            let passengerAddress = DOM.elid('withdraw-passenger-address').value;
            // Write transaction
            contract.withdraw(passengerAddress, (error, result) => {
                log('Passenger', 'Claim insurance', [ { label: 'Insurance', error: error, value: result.passenger } ]);
            });
        })

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let airlineAddress = DOM.elid('oracle-airline-address').value;
            let flightNumber = DOM.elid('oracle-flight-number').value;
            let timestamp = DOM.elid('oracle-timestamp').value;
            // Write transaction
            contract.fetchFlightStatus(airlineAddress, flightNumber, timestamp, (error, result) => {
                log('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    });
    

})();


function status(title, description, results) {
    displayDiv("display-status", title, description, results);
}

function log(title, description, results) {
    displayDiv("display-log", title, description, results);
}

function displayDiv(divId, title, description, results) {
    let div = DOM.elid(divId);
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    div.append(section);

}






