const input = require("input")
const {createPair, addLiquidity, removeLiquidity, hbarTotoken, tokenToHbar, tokenToToken, getLP} = require("./dex_utils.js")
let selectorText = "\nCP - Create Pair\nAL - Add liquidity\nRL - Remove Liquidity\nHTT - Hbar to Token swap\nTTH - Token to Hbar swap\nTTT - Token to Token swap\nGLP - Get Liquidity Pools\nEXT - Terminate Actions"
let seleOptions = ["CP", "AL", "RL", "HTT", "TTH", "TTT", "GLP", "EXT"]

async function test() {
    let name = await input.text("Hi😊, I am Swift Dex Terminal Help, What do I call you?")
    console.log(`Welcome ${name}, I am Swift Dex terminal Help, I am not perfect yet but i can perform some cool actions, What action do you want to peform?\n`)
    let options = await input.select(selectorText, seleOptions)
    if (options == "CP") {
        let tid = await input.text("Token Id?...")
        let tamt = await input.text("Token Amount?...")
        let hamt = await input.text("Hbar Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("creating pair...")
        let res = await createPair(tid, tamt, hamt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if(reentry == "Yes") {
            let tid = await input.text("Token Id?...")
            let tamt = await input.text("Token Amount?...")
            let hamt = await input.text("Hbar Amount?...")
            let accid = await input.text("Account Id?...")
            let acctkey = await input.password("Account Key?...")
            console.log("creating pair...")
            createPair(tid, tamt, hamt, accid, acctkey).then(e => {
            console.log(e)
        })
        } else process.exit(1)
    }
    if (options == "AL") {
        let tid = await input.text("Token Id?...")
        let tamt = await input.text("Token Amount?...")
        let hamt = await input.text("Hbar Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("adding liquidity...")
        let res = await addLiquidity(tid, tamt, hamt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if(reentry == "Yes") {
            let tid = await input.text("Token Id?...")
            let tamt = await input.text("Token Amount?...")
            let hamt = await input.text("Hbar Amount?...")
            let accid = await input.text("Account Id?...")
            let acctkey = await input.password("Account Key?...")
            console.log("adding liquidity...")
            addLiquidity(tid, tamt, hamt, accid, acctkey).then(e => {
            console.log(e)
        })
        } else process.exit(1)
    }
    if (options == "RL") {
        let tid = await input.text("Token Id?...")
        let tamt = await input.text("Token Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("removing Liquidity...")
        let res = await removeLiquidity(tid, tamt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if(reentry == "Yes") {
            let tid = await input.text("Token Id?...")
            let tamt = await input.text("Token Amount?...")
            let accid = await input.text("Account Id?...")
            let acctkey = await input.password("Account Key?...")
            console.log("removing Liquidity...")
            removeLiquidity(tid, tamt, accid, acctkey).then(e => {
            console.log(e)
        })
        } else process.exit(1)
    }
    if (options == "HTT") {
        let tid = await input.text("Token Id?...")
        let hamt = await input.text("Hbar Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("Swapping Hbar for Token...")
        let res = await hbarTotoken(tid, hamt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if (reentry == "Yes") {
            let tid = await input.text("Token Id?...")
            let hamt = await input.text("Hbar Amount?...")
            let accid = await input.text("Account Id?...")
            let acctkey = await input.password("Account Key?...")
            console.log("Swapping Hbar for Token...")
            hbarTotoken(tid, hamt, accid, acctkey).then(e => {
                console.log(e)
            })
        } else process.exit(1)
    }
    if (options == "TTH") {
        let tid = await input.text("Token Id?...")
        let tamt = await input.text("Token Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("Swapping Token for Hbar")
        let res = await tokenToHbar(tid, tamt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if (reentry == "Yes") {
            let tid = await input.text("Token Id?...")
            let tamt = await input.text("Token Amount?...")
            let accid = await input.text("Account Id?...")
            let acctkey = await input.password("Account Key?...")
            console.log("Swapping Token for Hbar...")
            tokenToHbar(tid, tamt, accid, acctkey).then(e => {
                console.log(e)
            })
        } else process.exit(1)
    }
    if (options == "TTT") {
        let idfr = await input.text("Token From Id?...")
        let idto = await input.text("Token To Id?...")
        let framt = await input.text("Token Amount?...")
        let accid = await input.text("Account Id?...")
        let acctkey = await input.password("Account Key?...")
        console.log("Swapping Token for Token...")
        let res = await tokenToToken(idfr, idto, framt, accid, acctkey)
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        if (reentry == "Yes") {
            let idfr2 = await input.text("Token From Id?...")
            let idto2 = await input.text("Token To Id?...")
            let framt2 = await input.text("Token Amount?...")
            let accid2 = await input.text("Account Id?...")
            let acctkey2 = await input.password("Account Key?...")
            console.log("Swapping Token for Token...")
            tokenToToken(idfr2, idto2, framt2, accid2, acctkey2).then(e => {
                console.log(e)
            })
        } else process.exit(1)
    }
    if (options == "GLP") {
        console.log("getting Liquidity Pools...")
        let res = await getLP()
        console.log(res)
        let reentry = await input.select("Do you want to perform this action again?...", ["Yes", "No"])
        reentry == "Yes"? getLP().then(e => {
            console.log("getting Liquidity Pools...")
            console.log(e)
        }).then(() => process.exit(1)) : process.exit(1)
    }
    if (options == "EXT") {
        console.log("Terminating Program...\nThank you for your time, Swift Dex is still far from perfect but will be continually be improved\nreport errors at https://forms.gle/mKMDFuUTQroeHJPq8")
        setTimeout(() => {process.exit(1)}, 2000);
    }
}

test()
