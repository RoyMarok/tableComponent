'use strict';
function httpGet(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
            if (this.status == 200) {
                resolve(this.response);
            } else {
                var error = new Error(this.statusText);
                error.code = this.status;
                reject(error);
            }
        };
        xhr.onerror = function() {
            reject(new Error("Network Error"));
        };
        xhr.send();
    });
}
function compare(field, order) {
    var len = arguments.length;
    if(len === 0) {
        return (a, b) => (a < b && -1) || (a > b && 1) || 0;
    }
    if(len === 1) {
        switch(typeof field) {
            case 'number':
                return field < 0 ?
                    ((a, b) => (a < b && 1) || (a > b && -1) || 0) :
                    ((a, b) => (a < b && -1) || (a > b && 1) || 0);
            case 'string':
                return (a, b) => (a[field] < b[field] && -1) || (a[field] > b[field] && 1) || 0;
        }
    }
    if(len === 2 && typeof order === 'number') {
        return order < 0 ?
            ((a, b) => {
                let aLower = (typeof a[field] === 'string')?a[field].toLowerCase():a[field];
                let bLower = (typeof b[field] === 'string')?b[field].toLowerCase():b[field];
                return (aLower < bLower && 1) || (aLower > bLower && -1) || 0
            }) :
            ((a, b) => {
                let aLower = (typeof a[field] === 'string')?a[field].toLowerCase():a[field];
                let bLower = (typeof b[field] === 'string')?b[field].toLowerCase():b[field];
                return (aLower < bLower && -1) || (aLower > bLower && 1) || 0
            });
    }
    var fields, orders;
    if(typeof field === 'object') {
        fields = Object.getOwnPropertyNames(field);
        orders = fields.map(key => field[key]);
        len = fields.length;
    } else {
        fields = new Array(len);
        orders = new Array(len);
        for(let i = len; i--;) {
            fields[i] = arguments[i];
            orders[i] = 1;
        }
    }
    return (a, b) => {
        for(let i = 0; i < len; i++) {
            if(a[fields[i]] < b[fields[i]]) return orders[i];
            if(a[fields[i]] > b[fields[i]]) return -orders[i];
        }
        return 0;
    };
}




function sortList(State){
    let newState = Object.assign({}, State);
    let dataSort = newState.data;
    let sortDirection = (newState.sorting.type=='DESC')?-1:1;
    dataSort = dataSort.map(item=>{
        if (/^\$/ig.test(item.price)) item.price=parseInt(item.price.replace(/^\$/ig, ''));
        return item;
    });
    dataSort.sort(compare(newState.sorting.field, sortDirection));
    dataSort = dataSort.map(item=>{
        item.price = '$'+item.price;
        return item;
    });
    newState.data = dataSort;
    return newState;
}
function renderCheckbox(item) {
    const defaultItem = {
        id:'',
        value:'',
        name:'',
        label:''
    };
    item = Object.assign(defaultItem, item);
    return `<span class="checkbox" >
            <input type="checkbox" class="masked" autocomplete="off" id="${item.id}" value="${item.id}" name="${item.name}"/>
            <span class="overTrop"></span>
        </span>
        <label class="">${item.label}</label>`;
}
function renderCheckList(List) {
    let checkList='';
    List.forEach(item=>{
        let checkboxData = {
            id:item.id,
            value:item.id,
            name:'categories',
            label:item.name,
        };
        checkList+='<li>'+renderCheckbox(checkboxData)+'</li>';
    });
    return `<ul>${checkList}</ul>`;
}

function renderTableRow(rowData){
    let rawRow='';
    let checkbox = renderCheckbox({id: `checkbox_${rowData['id']}`});
    for (let key in rowData){
        rawRow+=`<td data-key="${key}">${(key=='id')?checkbox:(key=='rating')?renderRatingStars(rowData[key]):rowData[key]}</td>`;
    }
    let row = `<tr>${rawRow}</tr>`
    return row;
}

function renderRatingStars(rating) {
    let percentage = rating*20;
    let markup = `<div class="stars" data-value="${rating}" style="background: linear-gradient(to right, #F5D327 0%, #F5D327 ${percentage}%, #fff ${percentage+1}%, #fff 100%)"></div>`
    return markup.toString();
}

function renderTable(State){
    let headerRaw='';
    for(let key in State.structure){
        headerRaw+=`<th data-key="${key}"
            class="${(State.sorting.type.length>0 && key==State.sorting.field)?'sort_'+State.sorting.type.toLowerCase():''}"
            ${(key!='id')?'onClick="changeSort(event)"':''}>
                ${State.structure[key]}
            </th>`;
    }
    let header = `<tr>${headerRaw}</tr>`;
    let list = '';
    State.data.forEach((thisRow)=>{list+=renderTableRow(thisRow)});
    let table=`<table>${header}${list}</table>`;
    return table;
}
function getCategories(url){
    return httpGet(url)
        .then(response => {
            return JSON.parse(response);
        })
}

function getProductList(url, State){
    return httpGet(url).then(response => {
        response = JSON.parse(response);
        // getting State structure
        let outState = Object.assign({}, State);
        response.forEach(elem => {
            if (!elem.length){
                outState.structure = elem;
            }
        });
        // tranform State data to Objects
        let storeData = [];
        response.forEach(elem => {
            if(elem.length && Object.keys(outState.structure).length>0){
                let storeDataElem = {};
                Object.keys(outState.structure).forEach((item, i, arr)=>{
                    storeDataElem[item] = elem[i];
                });
                storeData.push(storeDataElem);
            }
        });
        outState.data = storeData;
        return outState;
    })
}
function getTable(params=[]){
    let paramStr = (params.length>0)?'?'+params.join('&'):'';
    getProductList('/api/list'+paramStr, State).then(response => {
        State = sortList(response);
        placeTableAndEvents(State);
    });
}
function placeTableAndEvents(State) {
    let table = document.getElementById('tableComponent__table');
    table.innerHTML = renderTable(State);
    let thCollection = table.getElementsByTagName('th');
    for(let i=0;i<thCollection.length;i++){
        let thisItem = thCollection.item(i);
    }
}
function changeSort(elem) {
    console.log(elem);
    let srcElm = elem.srcElement;
    let sorting={
        field: srcElm.attributes['data-key'].value,
        type: ''
    };
    if(/sort_asc/ig.test(srcElm.className)){
        sorting.type = 'DESC';
    }else {
        sorting.type = 'ASC';
    }
    State.sorting = sorting;
    State = sortList(State);
    placeTableAndEvents(State);
}
function clearTable() {
    document.getElementById('tableComponent__table').innerHTML='';
}
function getAllChecks(){
    let params = [];
    document.getElementsByName("categories").forEach(item=>{
        if (item.checked) params.push(item.id)
    });
    getTable(params);
}

let State = {
    structure: {},
    data: [],
    sorting: {
        field: '',
        type: ''
    }
};

getCategories('/api/categories').then(response=>{
    document.getElementById('tableComponent__checks').innerHTML = renderCheckList(response);
    document.getElementsByName("categories").forEach(item=>{
        item.addEventListener("click", getAllChecks, false);
    });
});
getTable();
