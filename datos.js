import dotenv from "dotenv"
dotenv.config()

import {MongoClient,ObjectId} from "mongodb"

function conectar(){
    return MongoClient.connect(process.env.MONGO_URL)
}

export function leerColores(){
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
            return coleccion.find({}).toArray()
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

export function crearColor(objColor){
    return new Promise((ok,ko) => {

        let conexion = null

        conectar()
        .then( conexMongo => {
            conexion = conexMongo
            let coleccion = conexion.db("colores").collection("colores")
            // le pasamos el objeto a insertar
            return coleccion.insertOne(objColor)
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