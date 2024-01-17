const AlchemyWeb3 = require("@alch/alchemy-web3");
const _ = require("lodash");
const Tx = require('ethereumjs-tx').Transaction
const abiDecoder = require('abi-decoder');
const ethers = require('ethers'); // Require the ethers library
const utils = require('ethers').utils;
const config = require('./config.js')
let json = require('./abi.json');



abiDecoder.addABI(json);
const { spawn, exec } = require("child_process");


function getJSON() {
    console.log(json); // this will show the info it in firebug console
};

async function signTx(web3, fields = {}) {
  const nonce = await web3.eth.getTransactionCount(config.fromAddress, 'latest');
  console.log('nonce',nonce)
  const transaction = {
   'nonce': nonce,
   ...fields,
  };

  return await web3.eth.accounts.signTransaction(transaction, config.privateKey);
}

async function sendTx(web3, fields = {}) {
  const signedTx = await signTx(web3, fields);

  web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
    if (!error) {
      console.log("Transaction sent!", hash);
      const interval = setInterval(function() {
        console.log("Attempting to get transaction receipt...");
        web3.eth.getTransactionReceipt(hash, function(err, rec) {
          if (rec) {
            console.log(rec);
            clearInterval(interval);
          }
        });
      }, 1000);
    } else {
      console.log("Something went wrong while submitting your transaction:", error);
    }
  });
}

function sendMinimalLondonTx(web3,data,toAddress,price, number) {
  console.log('data',data, typeof data)
  web3.eth.estimateGas({
    from: config.fromAddress,
    data: data,
    to: toAddress,
    value: web3.utils.toWei(price, 'ether') * parseInt(number),
  }).then((estimatedGas) => {
    console.log("estimatedGas", estimatedGas);
    sendTx(web3, {
      gas: estimatedGas,
      maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei(config.maxPriorityFeePerGas, 'gwei')),
      maxFeePerGas: web3.utils.toHex(web3.utils.toWei(config.maxFeePerGas, 'gwei')),
      to: toAddress,
      value: web3.utils.toWei(price, 'ether') * parseInt(number),
      data: web3.utils.toHex(data)
    });
  });
}


const pendingTrasactions = async () => {
  let web3URL;
  let targetContract;
  let creator;


  console.log('Network Mode:', config.network);
  switch(config.network) {
    //---------------- TEST USAGE-------------------------
    case 'Rinkeby':{
      web3URL = config.wssRinkeby;
      targetContract = "";
      creator = "";
      break;
    }
    case 'Goerli':{
      web3URL = config.wssGoerli;
      targetContract = "";
      creator = "";
      break;
    }
    //-----------------------------------------------------
    default: {
      web3URL = config.wssMainnet;
      targetContract = config.toAddress;
      creator = config.creatorAddress;
    }
  }

  console.log('Web3URL:', web3URL);
  const web3 = AlchemyWeb3.createAlchemyWeb3(web3URL);
  var contract = new web3.eth.Contract(json, targetContract);

  //-----------------------------------------------------------------
  //--------------- Change this function every time------------------
  let extraData =  await contract.methods.publicSalesMint(config.number);
  //-----------------------------------------------------------------
  //-----------------------------------------------------------------

  let data = extraData.encodeABI();

  setInterval(function(){
    let date = Date.now();
    console.log("Current time:",date);
    if(date >= config.time*1000){
      console.log("It's the time!!")
      console.log("INPUT DATA",data);
      sendMinimalLondonTx(web3,data,targetContract,config.price, config.number);
    }
  },3000);
  //-----------------------------------------------------------------
    // your code 注意这里将 config.time 乘以1000，因为JavaScript的 Date.now() 返回的是毫秒级的时间戳，而 config.time 可能是秒级的时间戳
   
          
};

pendingTrasactions();

