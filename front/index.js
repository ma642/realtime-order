import React from 'react'
import {render} from 'react-dom'
import io from 'io'
import OrderTable from './order-table'

class Main extends React.Component {

	constructor() {
	  super()
	  this.state = {
	  	showStatus: 'current'
	  }
	  this.bhome = io('/bhome', {path:'/realtime-order'});
	  this.bhome.on('connect', (data) => {
	    console.log('on connect', data);
	    this.bhome.emit('sub', {}, d=>console.log(d));
	  });
	  
	}

	componentDidMount() {
		this.bhome.on('order', (msg)=>{
			this.setState(preState=>{
				const order = preState.order || {}
				const keys = Object.keys(order).slice(-100)
				return {
					order: {
						...keys.reduce((acc, key)=>({...acc, [key]:order[key]}), {}),
						[msg.ID]: msg
					}
				}
			})
		})
	}

	changeShowStatus = toStatus => ()=>{
		this.setState({
			showStatus: toStatus
		})
	}

	render() {
		const {showStatus} = this.state
		return <div>
			<button onClick={this.changeShowStatus('current')} disabled={showStatus=='current'}>当前委托</button>
			<button onClick={this.changeShowStatus('history')} disabled={showStatus=='history'}>历史委托</button>
            <OrderTable 
            showStatus={showStatus}
            data={Object.values(this.state.order||{})} />
        </div>
	}
}

render((
        <Main />
), document.getElementById('root'))