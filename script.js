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

function getCategories(url){
    return httpGet(url)
        .then(response => {
            return JSON.parse(response);
        })
}
function renderCheckList(List) {
    let checkList='';
    List.forEach(item=>{
        checkList+=`<li><input type="checkbox" name="categories" id="${item.id}" value="${item.id}" onChange=""/>${item.name}</li>`;

    });
    return `<ul>${checkList}</ul>`;

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
                // console.log(elem);
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

function sortList(State){
    let list=[];
    return list;
}

function filterList(list, rule){
    return list;
}
function renderTableRow(rowData){
    let rawRow='';
    let checkbox = `<input type="checkbox" name="" id="checkbox_${rowData['id']}" />`
    for (let key in rowData){
        rawRow+=`<td data-key="${key}">${(key=='id')?checkbox:rowData[key]}</td>`;
    }
    let row = `<tr>${rawRow}</tr>`
    return row;
}

function renderTable(State){
    let headerRaw='';
    for(let key in State.structure){
        headerRaw+=`<th>${State.structure[key]}</th>`;
    }
    let header = `<tr>${headerRaw}</tr>`;
    let list = '';
    State.data.forEach((thisRow)=>{list+=renderTableRow(thisRow)});
    let table=`<table>${header}${list}</table>`;
    return table;
}
function getTable(params=[]){
    let paramStr = (params.length>0)?'?'+params.join('&'):'';
    getProductList('/api/list'+paramStr, State).then(response => {
        State = response;
        document.getElementById('tableComponent__table').innerHTML = renderTable(State);
    });
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
