import React from 'react'
import {render} from 'react-dom'
import io from 'io'
import ReactTable from 'react-table'
import "react-table/react-table.css";
	  
const filteredHistory = (row)=> (row.OrderStatus == 5 || row.OrderStatus == 0)
const filteredCurrent = (row)=> (row.OrderStatus != 5 && row.OrderStatus != 0)

const columns = [{
    Header: 'ID',
    show: false,
    accessor: 'ID' // String-based value accessors!
  },{
	id: 'DT',
    Header: '时间',
    accessor: d=>d.InsertDate + ' ' +d.InsertTime // String-based value accessors!
  },{
    Header: '类型',
    accessor: 'OrderPriceType' // String-based value accessors!
  }, {
    Header: '币种',
    accessor: 'InstrumentID',
    //Cell: props => <span className='number'>{props.value}</span> // Custom cell components!
  }, {
    Header: '方向',
    accessor: 'Direction' // Custom value accessors!
  }, {
    Header: '状态',
    accessor: 'OrderStatusTxt' // Custom value accessors!
  }, {
    Header: props => <span>价格</span>, // Custom header components!
    accessor: 'Price'
  }]

class Main extends React.Component {

	render() {
		const filtered = (this.props.showStatus != 'current') ? filteredHistory: filteredCurrent
		//const {ID, OrderPriceType, InstrumentID, Direction, Price, OrderStatusTxt} = this.state.order || {}
		const {data=[]} = this.props
		const filteredData = data.filter(filtered)
		return <ReactTable 
		data={filteredData} columns={columns}
		showPagination={true}
		sortable={false}
		sorted={[{ // the sorting model for the table
	      id: 'ID',
	      desc: true
	    }]}
        className="-highlight"
		/>
	}
}

export default Main