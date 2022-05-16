const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
require("dotenv").config()
const { getLP, createAcct, importWithMnemonic, importWithKey, createPair, addLiquidity, removeLiquidity, hbarTotoken, tokenToHbar, tokenToToken, getTokenAmount, getHbarAmount, account_info } = require("./dex_utils.js")

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

app.listen(PORT, () => {
    console.log(`running on port - http://localhost:${PORT}`)
})

app.get("/LPs", (req, res) => {
    getLP().then( e => res.send(e))
})

app.get("/createAcct", (req, res) => {
    createAcct().then(e => res.send(e))
})

app.post("/importM", (req, res) => {
    const userinfo = req.body
    importWithMnemonic(userinfo.id, userinfo.mnemonic).then(e => res.send(e))
})

app.post("/importK", (req, res) => {
    const userinfo = req.body
    importWithKey(userinfo.id, userinfo.key).then(e => res.send(e))
})

app.post("/createpair", (req, res) => {
    const userinfo = req.body
    createPair(userinfo.tid, userinfo.tamount, userinfo.hamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/addliquidity", (req, res) => {
    const userinfo = req.body
    addLiquidity(userinfo.tid, userinfo.tamount, userinfo.hamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/removeliquidity", (req, res) => {
    const userinfo = req.body
    removeLiquidity(userinfo.tid, userinfo.tamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/hbartotoken", (req, res) => {
    const userinfo = req.body
    hbarTotoken(userinfo.tid, userinfo.hamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/tokentohbar", (req, res) => {
    const userinfo = req.body
    tokenToHbar(userinfo.tid, userinfo.tamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/tokentotoken", (req, res) => {
    const userinfo = req.body
    tokenToToken(userinfo.fromid, userinfo.toid, userinfo.tamount, userinfo.acctid, userinfo.acctkey).then(e => res.send(e))
})

app.post("/gettoken", (req, res) => {
    const userinfo = req.body
    getTokenAmount(userinfo.tid, userinfo.hamount).then(e => res.send(e))
})

app.post("/gethbar", (req, res) => {
    const userinfo = req.body
    getHbarAmount(userinfo.tid, userinfo.tamount).then(e => res.send(e))
})

app.get("/info/:id", (req, res) => {
    let {id} = req.params
    account_info(id).then(e => res.send(e))
})