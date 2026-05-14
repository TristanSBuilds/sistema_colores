const contenedorColores = document.querySelector("ul")
const formulario = document.querySelector("form")
const msgError = document.querySelector(".error")
const inputTexto = document.querySelector("form input")
const modalBorrar = document.querySelector(".modal-borrar")
const modalEditar = document.querySelector(".modal-editar")
const botonesModalBorrar = document.querySelectorAll(".modal-borrar button")
const botonesModalEditar = document.querySelectorAll(".modal-editar button")
const previewColor = document.querySelector(".color")
const inputsEditor = document.querySelectorAll(".modal-editar input")

// los colores que queremos borrar o editar los sacamos a sope global
let colorBorrar = null
let colorEditar = null

// objeto para crear el LI
class Color{
    // la fun contructora que recibe la info del objeto
    constructor({_id,r,g,b}, contenedor){
        // definimos las propiedades del obj 
        this.id = _id
        this.rgb =[r,g,b]
        /* DOM es el espacio en memoria UNICO para el LI especifico, 
        empieza null porque aun no esta creado, antes variable li */
        this.DOM = null

        //  llamamos a la fun para crear el LI y DOM deja de ser null
        this.crearColor(contenedor)
    }
    // metodo de clase para crear LI, recibe contenedor para añadir el LI creado
    crearColor(contenedor){
        this.DOM = document.createElement("li")

        let valor = this.rgb.join(",")

        this.DOM.style.backgroundColor = `rgb(${valor})`
        this.DOM.innerHTML = `
        <span>${valor}</span>
        <button class="btn-editar">editar</button>
        <button class="btn-borrar">borrar</button>`


        const botonEditar = this.DOM.querySelector(".btn-editar")
        const botonBorrar = this.DOM.querySelector(".btn-borrar")


        botonEditar.addEventListener("click", () => {
            colorEditar = this
            previewColor.style.backgroundColor = `rgb(${this.rgb.join(",")})`
    
            this.rgb.forEach((valor, i) => inputsEditor[i].value = valor )
    
            modalEditar.classList.add("modal-visible")
    
        })

        botonBorrar.addEventListener("click", () => {
            colorBorrar = this
            modalBorrar.classList.add("modal-visible")
        })

        contenedor.appendChild(this.DOM)
    }
}

// carga inicial de los datos
fetch("/colores")
.then( res => res.json())
.then( colores => {
    colores.forEach( c => {
        // por cada color que nos llega del back creamos un nuevo LI
        new Color(c, contenedorColores)
    })
})

formulario.addEventListener("submit", e => {
    e.preventDefault()

    let regex = /^(\d{1,3},){2}\d{1,3}$/

    msgError.classList.remove("visible")
    
    if(regex.test(inputTexto.value)){
        let valores = inputTexto.value.split(",").map( n => Number(n) ) 

        let i = 0

        let valido = true

        while(valido && i < valores.length){
            valido = valores[i] <= 255
            i++
        }

        if(valido){
            let [r,g,b] = valores
    
            let objColor = {
                r,g,b
            }
            /* 
            peticion desde el front al crear color con metodo POST
            por defecto tiene metodo get asi que debemos rellenar method, body y headers
            */
            
            return fetch("/nuevo", { 
                method : "POST",
                body : JSON.stringify(objColor),
                headers : {
                    "Content-type" : "application/json"
                }
            })
            .then( res => {
                if(res.status == 201){
                    return res.json()
                }
                throw "la peticion falló"
            })
            .then(({_id}) => {
                objColor._id = _id

                // por cada submit valido creamos un nuevo LI
                new Color(objColor, contenedorColores)

                inputTexto.value = "";
            })
            .catch( e => {
                console.log("informar user del error")
            })
        }
    }
    msgError.classList.add("visible")
})

botonesModalBorrar.forEach( (boton, i) => {
    boton.addEventListener("click", () => {
       if(i == 0){
            colorBorrar = null
            modalBorrar.classList.remove("modal-visible")
        }else{
            // peticion al back DELETE con parametro ID dinamico
            fetch(`/borrar/${colorBorrar.id}`, {
                method : "DELETE"
            })
            .then(res => {
                if(res.status == 204){
                    colorBorrar.DOM.remove()
                    colorBorrar = null
                    return modalBorrar.classList.remove("modal-visible")
                }
                console.log("informar al usuario del error")
            })
        }
    })
})

botonesModalEditar.forEach( (boton, i) => {
    boton.addEventListener("click", () => {
        if(i == 0){
            colorEditar = null
            modalEditar.classList.remove("modal-visible")
        }else{
            let [r,g,b] = colorEditar.rgb;

            // peticion al back PUT con parametro ID dinamico 
            fetch(`/actualizar/${colorEditar.id}`,{
                method : "PUT",
                body :  JSON.stringify({r,g,b}),
                headers : {
                    "Content-type" : "application/json" 
                }
            })  
           .then(res =>{
                if(res.status == 204){
                    colorEditar.DOM.style.backgroundColor = `rgb(${colorEditar.rgb.join(",")})`
                    colorEditar.DOM.children[0].innerText = colorEditar.rgb.join(",")
                    colorEditar = null
                    return modalEditar.classList.remove("modal-visible")
                }
           })
           console.log("informar al usuario del error")
       }
    })
})

inputsEditor.forEach((input, i) => {
    input.addEventListener("input", () => {
        colorEditar.rgb[i] = input.value
        previewColor.style.backgroundColor = `rgb(${colorEditar.rgb.join(",")})`
    })
})
