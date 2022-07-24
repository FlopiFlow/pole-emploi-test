const env = require('dotenv').config()
const axios = require('axios')
const fs = require('fs')

const express = require('express')
const app = express()

var access_token;

// Récupère un token d'accès, les clés API public et privé sont présentent dans les variables d'environnement
async function accessToken(){
    const params = new URLSearchParams()
    params.append( "grant_type", "client_credentials" )
    params.append( "client_id", process.env.API_PUBLIC )
    params.append( "client_secret", process.env.API_SECRET )
    params.append( "scope", "api_offresdemploiv2 o2dsoffre" )

    await axios.post( "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire", params, 
    {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    } )
    .then( response => {
        access_token = response.data.access_token
    } )
    .catch( error => {
        console.log( error )
    } )
}

// Contient les 150 dernières offres de pôle emploi, variable actualisée toute les 2 secondes
var last150;
function get_last150(){
    axios.get( 
        "https://api.emploi-store.fr/partenaire/offresdemploi/v2/offres/search",
        {
            params: {
                sort: 1
            },
            headers:{
                Authorization: `Bearer ${access_token}`
            }
        }
    )
    .then( response => {
        last150 = response.data.resultats
    } )
    .catch( error => {
        console.log( error )
    } )
}

const run = async () => {

    // Récupérer un token d'accès
    await accessToken()

    // Rafraîchir le token toute les 25 minutes
    setInterval( () => { accessToken() }, 1500 * 1000 )
    setInterval( () => 
    { 
        get_last150() 
    }, 2000 )

    app.use( express.json() )

    // Inclure le token d'accès dans le corps de la requête
    app.use( (req, res, next) => {
        req.body.access_token = access_token
        next()
    } )

    // Retourne last150
    app.get( "/get", (req, res) => {
        res.send( last150 )
    } )

    app.listen( process.env.PORT || 5000, () => {
        console.log(`Server listening at PORT ${ process.env.PORT || PORT }`)
    } )

}

run()