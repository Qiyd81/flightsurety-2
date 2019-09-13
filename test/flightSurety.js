const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  const airlineInitialFund = web3.utils.toWei("10", "ether");
  const oneEther = web3.utils.toWei("1", "ether");
  const timestamp = Math.floor(Date.now() / 1000);
  const lateFlight = "FLY-1"

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(constructor) checks first airline creation in contract deploy`, async function () {

    // Get operating status
    const airline = await config.flightSuretyApp.getAirline.call(config.firstAirline, { from: config.flightSuretyApp.address });
    
    // Checks airline atributes
    assert.equal(airline[0], 'Number One', 'Incorret name of first airline');
    assert.equal(airline[1], true, 'First airline not registered');
    assert.equal(airline[2], 0, "First airline should't have investements");
    assert.equal(airline[3], 0, "First airline should't have votes");
  });

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.firstAirline }); // Using first airline because it isn't the owner
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    await config.flightSuretyData.setOperatingStatus(false);

    await truffleAssert.reverts(config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address));

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);

  });
 
  it('(config) can authorize App Contract to call Data Contract functions', async () => {
    
    // ARRANGE
    let isAuthorized = false;

    // ACT
    try {
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
        isAuthorized = true;
    }
    catch(e) {
        console.log(e);
    }

    // ASSERT
    assert.equal(isAuthorized, true, "Contract Data doesn't authorize App Contract");

  });

  it('(airline) add funds to first Airline', async () => {

    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.firstAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.firstAirline);

    assert.equal(airline[0], 'Number One', 'Incorret name of first airline');
    assert.equal(airline[1], true, 'First airline not registered');
    assert.equal(airline[2], airlineInitialFund, "First airline should have funds");
  });

  it('(airline) first Airline adds second Airline]', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.secondAirline, 'Second Airline', {from: config.firstAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
  
    // Checks airline atributes
    assert.equal(airline[0], 'Second Airline', 'Name is not empty');
    assert.equal(airline[1], false, 'Second airline registered');
    assert.equal(airline[2], 0, "Second airline should't have investements");
    assert.equal(airline[3], 0, "Second airline should't have votes");

  });

  it('(airline) cannot add an Airline if it is not registered and with no funds', async () => {
    
    await truffleAssert.reverts(config.flightSuretyApp.addAirline(config.thirdAirline, 'Third Airline', {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);

    // Checks airline atributes
    assert.equal(airline[0], '', 'Name is not empty');
    assert.equal(airline[1], false, 'First airline not registered');
    assert.equal(airline[2], 0, "First airline should't have investements");
    assert.equal(airline[3], 0, "First airline should't have votes");

  });

  it('(airline) add initial funds to second Airline', async () => {
    
    await config.flightSuretyApp.fund({from: config.secondAirline, value: airlineInitialFund});

    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
    assert.equal(airline[0], 'Second Airline', 'Incorret name of second airline');
    assert.equal(airline[1], false, 'First airline not registered');
    assert.equal(airline[2], airlineInitialFund, "First airline should't have investements");
  });

  it('(airline) only registered airline can add other Airline', async () => {
    
    await truffleAssert.reverts(config.flightSuretyApp.addAirline(config.thirdAirline, 'Third Airline', {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    assert.equal(airline[1], false, 'Third airline not registered');
  });

  it('(airline) second Airline voted by first Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.secondAirline, {from: config.firstAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
    // Checks airline atributes
    assert.equal(airline[1], true, 'First airline not registered');
    assert.equal(airline[3], 1, "Second airline should have 1 vote");

  });

  it('(airline) second Airline with suficient funds and with one votes can add Third Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.thirdAirline, 'Third Airline', {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    assert.equal(airline[0], 'Third Airline', 'Incorret name of second airline');
    assert.equal(airline[1], false, 'Third airline not registered');
    assert.equal(airline[2], 0, "Third airline should't have investements");
    assert.equal(airline[3], 0, "Third airline should't have votes");
  });

  it('(airline) third Airline voted by second Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.thirdAirline, {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    // Checks airline atributes
    assert.equal(airline[1], true, 'Third airline not registered');
    assert.equal(airline[3], 1, "Third airline should have 1 vote");

  });

  it("(airline) third Airline can't add fourth Airline with no funds", async () => {
    
    await truffleAssert.reverts(config.flightSuretyApp.addAirline(config.fourthAirline, 'Fourth Airline', {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);

    // Checks airline atributes
    assert.equal(airline[0], '', 'Name is not correct');
    assert.equal(airline[1], false, 'Fourth airline registered');
 
  });

  it('(airline) third Airline adds funds to yourself', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.thirdAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Third Airline', 'Name is incorrect');
    assert.equal(airline[1], true, 'Third airline not registered');
    assert.equal(airline[2], airlineInitialFund, "Third airline should have investements");

  });

  it('(airline) third Airline registers fourth Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.fourthAirline, 'Fourth Airline', {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fourth Airline', 'Name is not correct');
    assert.equal(airline[1], false, 'Fourth airline registered');
  });

  it('(airline) third Airline votes in fourth Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fourthAirline, {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fourth Airline', 'Name is not correct');
    assert.equal(airline[1], true, 'Fourth airline not registered');
    assert.equal(airline[3], 1, "Fourth airline should have votes");
  });

  it('(airline) fourth Airline adds funds to yourself', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.fourthAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fourth Airline', 'Name is incorrect');
    assert.equal(airline[1], true, 'Fourth airline not registered');
    assert.equal(airline[2], airlineInitialFund, "Fourth airline should have investements");

  });

  it('(airline) fourth Airline registers fifth Airline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.fifthAirline, 'Fifth Airline', {from: config.fourthAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Name is not correct');
    assert.equal(airline[1], false, 'Fifth airline registered');
  });

  it('(airline) fourth Airline votes in fifth Airline', async () => {
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fifthAirline, {from: config.fourthAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Name is not correct');
    assert.equal(airline[1], false, 'Fourth airline registered');
    assert.equal(airline[3], 1, "Fourth airline should have 1 vote");
  });

  it('(airline) third Airline votes in fifth Airline', async () => {
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fifthAirline, {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Name is not correct');
    assert.equal(airline[1], false, 'Fourth airline registered');
    assert.equal(airline[3], 2, "Fourth airline should have 2 vote");
  });

  it('(airline) fifth Airline adds funds to yourself', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.fifthAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Name is incorrect');
    assert.equal(airline[1], false, 'Fifth airline not registered');
    assert.equal(airline[2], airlineInitialFund, "Fifth airline should have investements");

  });

  it("(airline) fifty Airline can't registers sixty Airline with insuficient votes", async () => {
    
    await truffleAssert.reverts(config.flightSuretyApp.addAirline(config.sixtyAirline, 'Sixty Airline', {from: config.fifthAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.sixtyAirline);

    // Checks airline atributes
    assert.equal(airline[1], false, 'Sixty airline registered');
  });
 
  it('(airline) second Airline votes in fifth Airline', async () => {
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fifthAirline, {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Name is not correct');
    assert.equal(airline[1], true, 'Fourth airline registered');
    assert.equal(airline[3], 3, "Fifth airline should have 2 votes");
  });
 
  it("(airline) fifth Airline registers sixty Airline with suficient votes", async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.sixtyAirline, 'Sixty Airline', {from: config.fifthAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.sixtyAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Sixty Airline', 'Name is not correct');
    assert.equal(airline[1], false, 'Sixty airline registered');
  });

  it("(insuree) insuree buy flight insurance", async () => {
    let beforeBalance = await web3.eth.getBalance(config.passengerOne);

    await truffleAssert.passes(config.flightSuretyApp.buy(config.fifthAirline, lateFlight, timestamp, {from: config.passengerOne, value: oneEther}));

    // Checks passenger balance
    let afterBalance = await web3.eth.getBalance(config.passengerOne);
    assert.ok(beforeBalance > afterBalance, "Balance incorrect!");
  });

  it("(insuree) insuree withdraw flight insurance", async () => {
    let beforeBalance = await web3.eth.getBalance(config.passengerOne);

    await truffleAssert.passes(config.flightSuretyApp.processFlightStatus(config.fifthAirline, lateFlight, timestamp, 20));
    await truffleAssert.passes(config.flightSuretyApp.withdraw({from: config.passengerOne}));

    // Checks passenger balance
    let afterBalance = await web3.eth.getBalance(config.passengerOne);
    assert.ok(beforeBalance < afterBalance, "Balance incorrect!");
  });

});
