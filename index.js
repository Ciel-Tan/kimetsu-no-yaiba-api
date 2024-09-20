const express = require("express")
const cors = require("cors")
const axios = require("axios")
const cheerio = require("cheerio")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")

dotenv.config()

const url_web = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki"

const app = express()
app.use(bodyParser.json({limit: "50mb"}))
app.use(cors())
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
)

app.get("/v1", (req, res) => {
    const thumbnails = []
    const limit = Number(req.query.limit)
    try{
        axios(url_web).then((resp) => {
            const html = resp.data
            const $ = cheerio.load(html)
            $(".portal", html).each(function() {
                const name = $(this).find("a").attr("title")
                const url = $(this).find("a").attr("href")
                const image = $(this).find("a > img").attr("data-src")
                thumbnails.push({
                    name: name,
                    url: "https://kimetsu-no-yaiba-api-rdxs.onrender.com/v1" + url.split("/wiki")[1],
                    image: image
                })
            })
            if (limit && limit > 0) {
                res.status(200).json(thumbnails.slice(0, limit))
            }
            else res.status(200).json(thumbnails)
        })
    }
    catch (err) {
        res.status(500).json(err)
    }
})

app.get("/v1/:character", (req, res) => {
    const url = url_web.split("Kimetsu_no_Yaiba_Wiki")[0] + req.params.character
    const titles = []
    const details = []
    const galleries = []
    const characterObj = {}
    const characters = []

    try {
        axios(url).then((resp) => {
            const html = resp.data
            const $ = cheerio.load(html)

            // get gallery
            $(".wikia-gallery-item", html).each(function(){
                const gallery = $(this).find("a > img").attr("data-src")
                galleries.push(gallery)
            })

            $("aside", html).each(function() {
                // get character img
                const image = $(this).find("img").attr("src")

                // get character titles
                const title = $(this).find("section > div > h3").each(function() {
                    titles.push($(this).text())
                })

                // get character details
                const detail = $(this).find("section > div > div").each(function() {
                    details.push($(this).text())
                })
                
                if (image !== undefined) {
                    for (let i = 0; i < titles.length; i++){
                        characterObj[titles[i].toLowerCase()] = details[i]
                    }

                    characters.push({
                        name: req.params.character.replace("_", " "),
                        gallery: galleries,
                        image: image,
                        ...characterObj
                    })
                }
            })
            res.status(200).json(characters)
        })
    }
    catch (err) {
        res.status(500).json(err)
    }
})

app.listen(process.env.PORT || 8000, (req, res) => {
    console.log("Server is running ...")
})