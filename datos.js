import dotenv from "dotenv"
dotenv.config()

import {MongoClient,ObjectId} from "mongodb"

function conectar(){
    return MongoClient.connect(process.env.MONGO_URL)
}

export function buscarUsuario(usuario){
    return new Promise((ok,ko) => {
        let conexion = null

        conectar()
        .then(conexMongo => {
            conexion = conexMongo

            let coleccion = conexion.db("colores").collection("usuarios")
            return coleccion.findOne({usuario})
        })
        .then(usuario => ok(usuario))
        .catch( e => ko({error : "error en bbdd"}))
        // finalmente cerramos la conexion
        .finally(() => {
            if(conexion){
                conexion.close()
            }
        })
    })
}

buscarUsuario("pepe")
.then(x => console.log(x))
.catch(x => console.log(x))

export function leerColores(usuario){
    // creamos promesa con exito o fallo
    return new Promise((ok,ko) => {

        // la coneion primero como null para luego cerrarla
        let conexion = null

        // llamamos a la fun para conectar a la bbdd
        conectar()
        // si se conecta
        .then( conexMongo => {
            // guardamos la conexion dnd era null
            conexion = conexMongo
            // guardamos la coleccion a la que queremos acceder
            let coleccion = conexion.db("colores").collection("colores")
            // mostramos como array TODO lo que hay en la coleccion
            return coleccion.find({usuario}).toArray()
        })
        // si se muestra el array pasamos ok con los colores
        .then( colores => ok(colores))
        // si hay error en la conexion o en mostrar los colores
        .catch( e => ko({error : "error en bbdd"}))
        // finalmente cerramos la conexion
        .finally(() => {
            if(conexion){
                conexion.close()
            }
        })
    })
}

export function crearColor(obj){
    return new Promise((ok,ko) => {

        let conexion = null

        conectar()
        .then( conexMongo => {
            conexion = conexMongo
            let coleccion = conexion.db("colores").collection("colores")

            return coleccion.insertOne(obj)
        })
        // le pedimos que nos devuelva solo el id del obj creado
        .then( resultado => ok(resultado.insertedId))
        .catch( e => ko({error : "error en bbdd"}))
        .finally(() => {
            if(conexion){
                conexion.close()
            }
        })
    })
}
/*
crearColor({usuario : '6a04524b339603b1c0ee62fc', r : 50, g : 0, b : 250})
.then(x => console.log(x))
.catch(x => console.log(x))
*/
export function borrarColor(id){
    return new Promise((ok,ko) => {

        let conexion = null

        conectar()
        .then( conexMongo => {
            conexion = conexMongo
            let coleccion = conexion.db("colores").collection("colores")
            // le pasamos un el id como un nuevo objeto
            return coleccion.deleteOne({ _id : new ObjectId(id)})
        })
        // le pedimos que nos devueva el numero de objs borrados
        .then( resultado => ok(resultado.deletedCount) )
        .catch( e => ko({error : "error en bbdd"}))
        .finally(() => {
            if(conexion){
                conexion.close()
            }
        })
    })
}

export function actualizarColor(id, objCambios){
    return new Promise((ok,ko) => {

        let conexion = null

        conectar()
        .then( conexMongo => {
            conexion = conexMongo
            let coleccion = conexion.db("colores").collection("colores")
            // pasamos el id y lo que queremos cambiar
            return coleccion.updateOne(
                { _id : new ObjectId(id) }, 
                { $set : objCambios}
            )
        })
        .then( resultado => {
            let {matchedCount,modifiedCount} = resultado
            ok({matchedCount,modifiedCount})
        })
        .catch( e => ko({error : "error en bbdd"}))
        .finally(() => {
            if(conexion){
                conexion.close()
            }
        })
    })
}
/*
actualizarColor('69fb3478f0d8f49ef4709bbd', { r : 255, g : 200, b : 0 })
.then(x => console.log(x))
.catch(x => console.log(x))
*/