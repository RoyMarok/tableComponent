;(function( window, document ) {
class tableLoader {
    constructor(inParams){
        this.defaultParams = {
            categoriesUrl: '/api/categories',
            listUrl: '/api/list',
        };
        this.params = Object.assign(this.defaultParams, inParams);
        this.wrapper;
        this.State = {
            structure: {},
            data: [],
            sorting: {
                field: '',
                type: ''
            }
        };

        this.render = this.render.bind(this);
        this.sortList = this.sortList.bind(this);
        this.renderCheckList = this.renderCheckList.bind(this);
        this.renderTableRow = this.renderTableRow.bind(this);
        this.renderTable = this.renderTable.bind(this);
        this.getCategories = this.getCategories.bind(this);
        this.getProductList = this.getProductList.bind(this);
        this.getTable = this.getTable.bind(this);
        this.placeTableAndEvents = this.placeTableAndEvents.bind(this);
        this.changeSort = this.changeSort.bind(this);
        this.getAllChecks = this.getAllChecks.bind(this);
        this.init = this.init.bind(this);
    }
    render(DOMElementId) {
        this.wrapper = document.createElement('div');
        this.wrapper.className = "tableComponent";

        let checkWrapper = document.createElement('div');
        checkWrapper.className = 'tableComponent__checks';
        checkWrapper.id = 'tableComponent__checks';
        this.wrapper.appendChild(checkWrapper);

        let tableWrapper = document.createElement('div');
        tableWrapper.className = 'tableComponent__table';
        tableWrapper.id = 'tableComponent__table';
        this.wrapper.appendChild(tableWrapper);
        // console.log(DOMElementId);

        if (DOMElementId){
            document.getElementById(DOMElementId).appendChild(this.wrapper);
        } else {
            document.body.appendChild(this.wrapper);
        }
        this.init();

    }
    init(){
        this.getCategories(this.params.categoriesUrl).then(response=>{
            this.wrapper.getElementsByClassName('tableComponent__checks')[0].innerHTML = this.renderCheckList(response);
            let catCollection = this.wrapper.getElementsByClassName("categories");
            for(let i=0; i<catCollection.length; i++){
                let thisItem = catCollection.item(i);
                thisItem.addEventListener("click", this.getAllChecks, false);
            }
        });
        this.getTable();
    }

    httpGet(url) {
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
    compare(field, order) {
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




    sortList(State){
      let newState = Object.assign({}, State);
      let dataSort = newState.data;
      let sortDirection = (newState.sorting.type=='DESC')?-1:1;
      dataSort = dataSort.map(item=>{
          if (/^\$/ig.test(item.price)) item.price=parseInt(item.price.replace(/^\$/ig, ''));
          return item;
      });
      dataSort.sort(this.compare(newState.sorting.field, sortDirection));
      dataSort = dataSort.map(item=>{
          item.price = '$'+item.price;
          return item;
      });
      newState.data = dataSort;
      return newState;
    }
    renderCheckbox(item) {
      const defaultItem = {
          id:'',
          value:'',
          name:'',
          label:'',
          className: ''
      };
      item = Object.assign(defaultItem, item);
      return `<span class="checkbox" >
              <input type="checkbox" class="masked ${item.className}" autocomplete="off" id="${item.id}" value="${item.id}" name="${item.name}"/>
              <span class="overTrop"></span>
          </span>
          <label class="">${item.label}</label>`;
    }
    renderCheckList(List) {
      let checkList='';
      List.forEach(item=>{
          let checkboxData = {
              id:item.id,
              value:item.id,
              name:'categories',
              className:'categories',
              label:item.name,
          };
          checkList+='<li>'+this.renderCheckbox(checkboxData)+'</li>';
      });
      return `<ul>${checkList}</ul>`;
    }

    renderTableRow(rowData){
      let rawRow='';
      let checkbox = this.renderCheckbox({id: `checkbox_${rowData['id']}`});
      for (let key in rowData){
          rawRow+=`<td data-key="${key}">${(key=='id')?checkbox:(key=='rating')?this.renderRatingStars(rowData[key]):rowData[key]}</td>`;
      }
      let row = `<tr>${rawRow}</tr>`
      return row;
    }

    renderRatingStars(rating) {
      let percentage = rating*20;
      let markup = `<div class="stars" data-value="${rating}" style="background: linear-gradient(to right, #F5D327 0%, #F5D327 ${percentage}%, #fff ${percentage+1}%, #fff 100%)"></div>`
      return markup.toString();
    }

    renderTable(State){
      let headerRaw='';
      for(let key in State.structure){
          headerRaw+=`<th data-key="${key}"
              class="${(State.sorting.type.length>0 && key==State.sorting.field)?'sort_'+State.sorting.type.toLowerCase():''}">
                  ${State.structure[key]}
              </th>`;
      }
      let header = `<tr>${headerRaw}</tr>`;
      let list = '';
      State.data.forEach((thisRow)=>{list+=this.renderTableRow(thisRow)});
      let table=`<table>${header}${list}</table>`;
      return table;
    }
    getCategories(url){
      return this.httpGet(url)
          .then(response => {
              return JSON.parse(response);
          })
    }

    getProductList(url, State){
      return this.httpGet(url).then(response => {
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
    getTable(params=[]){
      let paramStr = (params.length>0)?'?'+params.join('&'):'';
      this.getProductList(this.params.listUrl+paramStr, this.State).then(response => {
          this.State = this.sortList(response);
          this.placeTableAndEvents(this.State);
      });
    }
    placeTableAndEvents(State) {
      let table = this.wrapper.getElementsByClassName('tableComponent__table')[0];
      table.innerHTML = this.renderTable(State);
      let thCollection = table.getElementsByTagName('th');
      for(let i=1;i<thCollection.length;i++){
          let thisItem = thCollection.item(i);
          thisItem.addEventListener("click", this.changeSort, false);
      }
    }
    changeSort(elem) {
    //   console.log(elem);
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
      this.State.sorting = sorting;
      this.State = this.sortList(this.State);
      this.placeTableAndEvents(this.State);
    }
    clearTable() {
      this.wrapper.getElementsByClassName('tableComponent__table')[0].innerHTML='';
    }
    getAllChecks(){
      let params = [];
      let catCollection = this.wrapper.getElementsByClassName("categories");
      for(let i=0; i<catCollection.length; i++){
          let thisItem = catCollection.item(i);
          if (thisItem.checked) params.push(thisItem.id)
      }
      this.getTable(params);
    }

}
window.tableLoader = tableLoader;
})(window, document)
