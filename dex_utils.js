const { ApiSession, Contract }  = require("@buidlerlabs/hedera-strato-js")
const { Hbar, AccountId, HbarUnit, ContractId, TokenCreateTransaction, TokenSupplyType, TokenType, Client, TokenUpdateTransaction, PrivateKey, TokenInfoQuery, TokenId, AccountCreateTransaction, Mnemonic, AccountInfoQuery} = require("@hashgraph/sdk")
require("dotenv").config()
const axios = require('axios').default;
const facAbi = require("./ABI/Factory.json")
const exAbi = require("./ABI/Exchange.json")

let id = process.env.MY_ACCOUNT_ID;
let key = process.env.MY_TESTNET_PRIVATE_KEY;

function setClient(Accid = id, AccKey = key) {
    return Client.forTestnet().setOperator(Accid, AccKey)
}
let client = setClient()

async function deployContracts(c_path) {
    console.log("getting session...")
    const { session } = await ApiSession.default()
    let CTP = await Contract.newFrom({path: c_path, ignoreWarnings: true})
    console.log("compiling...")
    let deployed = await session.upload(CTP)
    console.log("deploying...")

    console.log(`new contract ID - ${deployed.id.toString()}`)
}

async function getinfo(id) {
    let info = await new TokenInfoQuery()
    .setTokenId(id)
    .execute(client)

    let n = info.name
    let s = info.symbol
    let d = info.decimals
    return { n, s, d }
}

async function coin_price(coin="hbar") {
    const info = await axios.get(`https://data.messari.io/api/v1/assets/${coin}/metrics`)
    const res = info.data.data.market_data.price_usd
    let price = res.toFixed(3)
    return price
}

async function optInLPtoken(contract, gas, account) {
    let result;
    try {
        let r = await contract.associateAcct({gas: gas}, account)
        result = r
    } catch (e) {
        return e
    }
    return result
}

async function optInExToken(contract, gas, account) {
    let result;
    try {
        let r = await contract.associateToken({gas: gas}, account)
        result = r
    } catch (e) {
        return e
    }
    return result
}

async function optInContract(contract, gas, token) {
    let result;
    try {
        let r = await contract.associateContract({gas: gas}, token)
        result = r
    } catch (e) {
        return e
    }
    return result
}

async function accountChecker(accid) {
    let isAcct;
    try {
        let accinfo = await new AccountInfoQuery()
        .setAccountId(accid)
        .execute(client)
        if (accinfo.balance.toString() >= "0") {
            isAcct = true
        }
    } catch(e) {
        isAcct = false
    }
    return isAcct
}

exports.createPair = async function createPair(t_addr, t_amt, h_amt, accid, acckey) {
    try {
        const TokenCreator = await ApiSession.default()
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await TokenCreator.session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let price = await coin_price()
        let htosend = (1.1/price).toFixed(3)
        await factory_contract.createExchange({amount: Hbar.from(htosend, HbarUnit.Hbar).toBigNumber(), gas: 4000000},TokenId.fromString(t_addr).toSolidityAddress())
        let ex_conaddr = await factory_contract.getExchange(TokenId.fromString(t_addr).toSolidityAddress())
        let exchange_addr = ContractId.fromSolidityAddress(ex_conaddr.id)
        let exchange_contract = await session.getLiveContract({id: exchange_addr, abi: exAbi,})
        await optInContract(exchange_contract, 3000000, TokenId.fromString(t_addr).toSolidityAddress())
        await optInLPtoken(exchange_contract, 3000000, session.wallet.account.id.toSolidityAddress())
        var { n, s, d } = await getinfo(t_addr)
        let lpt = await exchange_contract.addLiquidity({amount: Hbar.from(h_amt, HbarUnit.Hbar).toBigNumber(), gas: 5000000}, t_amt * (10 ** d))
        exchange_contract.onEvent("AddLiquidity", ({sender, message}) => {
            console.log(`Add liquidity Event: ${message}`)
        })
        return {"Pair": `${s}/Hbar`, "Token Name": n, "LP token Recieved": lpt.toNumber()}
    } catch(e) {
        return `Error Creating ${s}/Hbar Pair`;
    }
}

exports.addLiquidity = async function addLiquidity(tAddr, tamt, hAmt, accid, acckey) {
    try {
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        await optInLPtoken(exchange_contract, 3000000, session.wallet.account.id.toSolidityAddress())
        var { n, s, d } = await getinfo(tAddr)
        let lpt = await exchange_contract.addLiquidity({amount: Hbar.from(hAmt, HbarUnit.Hbar).toBigNumber(), gas: 5000000}, tamt * (10 ** d))
        exchange_contract.onEvent("AddLiquidity", ({sender, message}) => {
            console.log(`Add liquidity Event: ${message}`)
        })
        return {"Pair": `${s}/Hbar`, "Token Name": n, "LP tokens Recieved": lpt.toNumber()}
    } catch(e) {
        return `Error Adding Liquidity for ${s}/Hbar`
    }
}

exports.removeLiquidity = async function removeLiquidity(tAddr, t_amt, accid, acckey) {
    try {
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        var { n, s, d } = await getinfo(tAddr)
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        let [hamt, tamt] = await exchange_contract.removeLiquidity(t_amt * (10 ** 8))
        let result =  {"Pair": `${s}/Hbar`, "Token Name": n, "Hbar Recieved": hamt.toNumber()/100000000}
        result[`${s} Received`] = tamt.toNumber()/ (10 ** d)
        return result
    } catch(e) {
        return `Error Removing Liqudity for ${s}`
    }
}


exports.tokenToHbar = async function tokenToHbar(tAddr, tamt, accid, acckey) {
    try {
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        var { n, s, d } = await getinfo(tAddr)
        let ttr = await exchange_contract.getHbar(tamt* (10 ** d))
        let hbarec = await exchange_contract.tokenTohbar(tamt* (10 ** d), ttr.toNumber())
        let result = {}
        result[`${s} Deposited`] = tamt* (10 ** d)
        result["Hbar recieved"] = hbarec.toNumber()/100000000
        return result;
    } catch(e) {
        return `Error Swapping ${s} to Hbar`
    }
}

exports.hbarTotoken = async function hbarTotoken(tAddr, hAmt, accid, acckey) {
    try {
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        await optInExToken(exchange_contract, 3000000, session.wallet.account.id.toSolidityAddress())
        var { n, s, d } = await getinfo(tAddr)
        let ttr = await exchange_contract.getToken(Hbar.from(hAmt, HbarUnit.Hbar).toTinybars().toNumber())
        let tokenR = await exchange_contract.hbarTotokenSwap({amount: Hbar.from(hAmt, HbarUnit.Hbar).toBigNumber()}, ttr.toNumber())
        let result = {}
        result["Hbar deposited"] = Hbar.from(hAmt, HbarUnit.Hbar).toTinybars().toNumber()
        result[`${s} received`] = tokenR.toNumber()/ (10 ** d)
        return result;
    } catch(e) {
        return `Error Swapping Hbar to ${s}`
    }
}

exports.tokenToToken = async function tokenToToken(fromAddr, toAddr, fromAmt, accid, acckey) {
    try {
        const { session } = await ApiSession.default({wallet: {sdk : {operatorId: accid, operatorKey: acckey}}})
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addrFr = await factory_contract.getExchange(TokenId.fromString(fromAddr).toSolidityAddress())
        let exchange_addrTo = await factory_contract.getExchange(TokenId.fromString(toAddr).toSolidityAddress())
        let exchange_contractFr = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addrFr.id), abi: exAbi,})
        let exchange_contractTo = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addrTo.id), abi: exAbi,})
        var { n, s, d } = await getinfo(fromAddr)
        var td = await getinfo(toAddr)
        let estfromate = await exchange_contractFr.getHbar(fromAmt * (10 ** d))
        let estomate = await exchange_contractTo.getToken(estfromate.toNumber())
        await optInExToken(exchange_contractTo, 4000000, session.wallet.account.id.toSolidityAddress())
        await exchange_contractFr.TokenToToken({gas:3000000}, TokenId.fromString(toAddr).toSolidityAddress(), fromAmt * (10 ** d), estomate.toNumber())
        let result = {}
        result[`${s} Deposited`] = fromAmt * (10 ** d)
        result [`${td.s} Recieved`] = estomate.toNumber() / (10 ** td.d)
        return result
    } catch(e) {
        return `Error Swapping ${s} to ${td.s}`
    }
}

exports.getTokenAmount = async function getTokenAmount(tAddr, hAmt) {
    try {
        const { session } = await ApiSession.default()
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        var { n, s, d } = await getinfo(tAddr)
        let ttr = await exchange_contract.getToken(Hbar.from(hAmt, HbarUnit.Hbar).toTinybars().toNumber())
        return {"Token Amount" : ttr.toNumber()/(10 ** d), "Hbar deposited": Hbar.from(hAmt, HbarUnit.Hbar).toBigNumber().toNumber()}
    } catch (e) {
        return "Error getting Token amount"
    }
}

exports.getHbarAmount = async function getHbarAmount(tAddr, tamt) {
    try {
        const { session } = await ApiSession.default()
        let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
        let exchange_addr = await factory_contract.getExchange(TokenId.fromString(tAddr).toSolidityAddress())
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        var { n, s, d } = await getinfo(tAddr)
        let ttr = await exchange_contract.getHbar(tamt* (10 ** d))
        let res = {}
        res[`${s} deposited`] = tamt
        res["Hbar Amount"] = ttr.toNumber() / (10 ** 8)
        return res
    } catch(e) {
        return "Error getting Hbar amount"
    }
}

exports.getLP = async function getLP() {
    try {
        let lpJson = {}
    let lplist = []
    lpJson["Name"] = "Swift Dex"
    const { session } = await ApiSession.default()
    let factory_contract = await session.getLiveContract({id: ContractId.fromString(contract_Fac), abi: facAbi,})
    let addresses = await factory_contract.Exchange_Addresses()
    lpJson["NUmber of Pools"] = addresses.length
    lpJson["Pools"] = lplist

    for (var i = 0; i < addresses.length; i++) {
        let exchange_addr = await factory_contract.getExchange(addresses[i])
        let tid = TokenId.fromSolidityAddress(addresses[i]).toString()
        let {n, s, d} = await getinfo(TokenId.fromSolidityAddress(addresses[i]))
        let exchange_contract = await session.getLiveContract({id: ContractId.fromSolidityAddress(exchange_addr.id), abi: exAbi,})
        let tokenReserve = await exchange_contract.getTokenReserve()
        let hbarReserve = await exchange_contract.getHbarReserve()
        let details = {"TokenId": tid, "Pair": `${s}/Hbar`, "Token Reserve": tokenReserve.toNumber()/ (10 ** d), "Hbar Reserve": hbarReserve.toNumber()/ (10 ** 8)}
        lplist.push(details)
    }
    return lpJson
    } catch(e) {
        return "Error Getting Liquidity Pools"
    }
}

exports.createAcct = async function createAcct() {
    let acct_deet = {}
    try {
        let mnemonic= (await Mnemonic.generate()).toString();
        let newPrivatekey = await PrivateKey.fromMnemonic(mnemonic)
        let newPublickey = newPrivatekey.publicKey;
        let newKey = newPrivatekey.toString()
        
        const newWallet = await new AccountCreateTransaction()
        .setKey(newPublickey)
    	.execute(client);

        let newAcctID = (await newWallet.getReceipt(client)).accountId.toString();
        acct_deet["account_ID"] = newAcctID
        acct_deet["privateKey"] = newKey
        acct_deet["mnemonic"] = mnemonic
    } catch(e) {
        acct_deet["Status"] = "Failed"
    }
    return acct_deet
}

exports.importWithMnemonic = async function importWithMnemonic(accountId, mnemonic) {
    const userPrivatekey = await PrivateKey.fromMnemonic(mnemonic)
    let stat = await accountChecker(accountId)
    let deet = {}
    deet["Private Key"] = userPrivatekey.toStringRaw()
    deet["account ID"] = !stat ? null : accountId
    return deet
}

exports.importWithKey = async function importWithKey(accountId, privatekey) {
    const userPrivatekey = PrivateKey.fromString(privatekey)
    let stat = await accountChecker(accountId)
    let deet = {}
    deet["Private Key"] = userPrivatekey.toStringRaw()
    deet["account ID"] = !stat ? null : accountId
    return deet
}

