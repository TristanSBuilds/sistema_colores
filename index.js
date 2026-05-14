import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import dotenv from "dotenv"
dotenv.config()

import {
    leerColores, crearColor, borrarColor, actualizarColor, buscarUsuario
} from "./datos.js"

const app = express()


// funcion para verificar si el token es correcto y darle acceso a la info 
function autorizar(req,res,next){
    // desesctructuramos el token desde el HEADER (no el body)
    let {authorization} = req.headers

    // si el header viene vacio -> 401 unauthorised
    if(authorization == undefined){
        return res.sendStatus(401)
    }

    let posibleToken = authorization.split(" ")

    if(posibleToken[0] != "Bearer" || !posibleToken[1]){
        return next(true)
    }
    
    jwt.verify(posibleToken[1],process.env.SECRET, (error, datos) => {
        // si no lo admite -> 401 unauthorised
        if(error){
            return res.send(401) 
        }
        /* si el token es correcto guardamos los datos del token (que 
        contiene el id) en el obj req
        */
        req.usuario = datos.id
        // pasamos el middleware y le damos acceso a su info
        next()
    })   
}

/*
middleware q activa el traductor json, cuando el front envie datos
con req.body los transfroma de texto plano a obj js
*/
app.use(express.json())

// servimos los ficheros estaticos
//app.use(express.static("./front"))

// endpoint de login, esta abierto
app.post("/login", async (req,res,next) => {
    // desesctrucutramos ususario y contraeña de la peticion
    let {usuario, password} = req.body
    
    // si alguno de los dos viene vacio -> 400 bad request
    if(usuario == undefined || password == undefined){
        return next(true)
    }
    
    // llamamos a la fun y esperamos que busque el usuario en la bbdd
    let usuarioBBDD = await buscarUsuario(usuario)
        
    // si no encuentra el usuario -> 401 unauthorised
    if(!usuarioBBDD){
        return res.sendStatus(401)
    }

    // esperamos a q bcrypt compare la contraseña con la encriptada q devuelve bool
    let valido = await bcrypt.compare(password, usuarioBBDD.password)

    // si no son iguales -> 403 forbbiden
    if(!valido){
        return res.sendStatus(403)
    }
    
    // si user y password bien, creamos token pasandole el id como dato y el secret
    let token = jwt.sign({id : usuarioBBDD._id}, process.env.SECRET)

    // devolvemos el token como respuesta para el front
    res.json({token})
})

/*
todo lo que esta debajo de este middleware es info privada y debe 
pasar por la funcion de autorizar para acceder a los datos
*/
app.use(autorizar)


// cuando entras a la url se ejecuta, es una funcion asincrona
app.get("/colores", async (req,res) => {
    try{
        // prueba a leer los colores, espera a recibir la res y los guarda en la variable
        let colores = await leerColores(req.usuario)

        // los parsea, descodifca de json a obj js
        res.json(colores)

    }catch(e){
        // si falla sale error 500
        res.status(500)

        res.json({ error : "error en el servidor" })

    }
})

app.post("/nuevo", async (req,res,next) => {
    // desestructuramos el rgb 
    let {r,g,b} = req.body

    // creamos array de rgb
    let rgb = [r,g,b]

    let i = 0

    let valido = true

    // mientras valido sea true y el i no pase de 3
    while(valido && i < rgb.length){
        /*valido true si es true que el num del i actual tiene min 1 max y 
        3 digitos y pasado de str a num es igual o menos a 255 
        */
        valido = /^\d{1,3}$/.test(rgb[i]) && Number(rgb[i]) <= 255
        i++
    }
    // si valido es false devolvemos la fun next que se va al midleware que da bad request 400
    if(!valido){
        return next(true)
    }

    // si sigue siendo valido ejecuta este bloque
    try{
        let {usuario} = req
        // llamamos a la funcion y guarda en colores.json el color y devuelve el id
        let _id = await crearColor({r,g,b,usuario}) 

        // devolvemos estado 201 al crear hacer post y haya ido bien 
        res.status(201)

        // respondemos al front diciendo OK, dandole el id del color que tiene que pintar
        res.json({_id})

    }catch(e){
        // si falla sale error 500
        res.status(500)

        res.json({ error : "error en el servidor" })

    }
})

// utilizamos path dinamico, "/algo/:hola"
app.put("/actualizar/:id", async (req, res, next) => {
    // desescructuramos el ID con .PARAMS -> la parte dinamica del path
    let {id} = req.params

    // probamos si el id es un str de 24 carac hexadecimales
    let valido = /^[0-9a-f]{24}$/.test(id)

    // si valido es false
    if(!valido){
        // se va al middleware de 404 not found
        return next()
    }

    // desescrturamos el rgb del body
    let {r, g, b} = req.body
    
    // creamos un array con el rgb y lo iteramos con map para sacar un array de objetos
    let rgb = [r,g,b].map(n => {
        // esta variable guarda si el numero se ha intentado editar o no se ha intentado editar
        // si no se ha tocado sera undefined por lo tanto true y si si sera false
        let isUndefined = n == undefined

        // valido sera true si tiene min 1 y max 3 digitos Y es igual o menos a 255
        let valido = /^\d{1,3}$/.test(n) && Number(n) <= 255

        // devolvemos un array de objetos 
        return {valido,isUndefined}
    })
    
    let i = 0 

    valido = true

    // son las keys que vamos a utilizar para armar el objActualizar
    let claves = ["r","g","b"]

    // almacenamos UNICAMENTE los colores que el usuario envío Y son correctos
    let objActualizar = {}

    // mientas valido true y el i no pase de 3
    while(valido && i < rgb.length){
        // si el color NO es undefined (o sea que SI esta) 
        if(!rgb[i].isUndefined){
            // valido sera true si el color es valido (tiene min 1 max 3 dig y = o menor a 255)
            valido = rgb[i].valido
            if(valido){
                /*
                como en python, creamos una nueva CLAVE dentro del obj, la cual sacamos 
                del array claves dependiendo del i del while, que va a ser igual(:) al 
                VALOR numerico que el usuario introdujo en el front para esa clave
                */
                objActualizar[claves[i]] = req.body[claves[i]]
            }
        }
        i++
    }
    
    // si valido ha pasado como false, nos vamos al middleware de 400 bad request
    if(!valido){
        return next(true)
    }

    // si pasa el id y el rgb como validos ejecutamos este bloque
    try{
        // llamamos a la funcion y le pasamos el id y los valores nuevos
        let {matchedCount} = await actualizarColor(req.params.id, objActualizar)
        
        // si no ha encontrado nada para editar (0 false) 404
        if(!matchedCount){
            return next()
        }

        // devuelvemos 204 no content
        res.sendStatus(204)

    }catch(e){
        // si falla sale error 500
        res.status(500)

        res.json({ error : "error en el servidor" })

    }
})

// path con parametro dinamico
app.delete("/borrar/:id", async (req, res, next) => {
    // sacamos el id del path
    let {id} = req.params

    // probamos si el id es un str de 24 carac hexadecimales
    let valido = /^[0-9a-f]{24}$/.test(id)

    // si el id no es valido
    if(!valido){
        // se va al middleware de 404 not found
        return next()
    }

    // si pasa el id ejecuta este bloque
    try{
        // ejecutamos la funcion pasandole el id como numero
        let cantidad = await borrarColor(id)

        // si el deletedCount es 0(false) se va a 404
        if(!cantidad){
            return next()
        }

        // no content 204
        res.sendStatus(204)

    }catch(e){
        // si falla sale error 500
        res.status(500)

        res.json({ error : "error en el servidor" })

    }
})

// middleware que usamos cuando la peticion no se hace correctamente
app.use((error, req, res, next) => {
    console.log(error)
    res.status(400) // bad request
    res.json({ error : "error en la petición" })
})

// middleware que utilizmos cuando no encontramos el id
app.use((req ,res) => {
    res.status(404); // not found
    res.json({ error : "recurso no encontrado" })
})

// escuchamos peticiones en el puerto 4000
app.listen(process.env.PORT)