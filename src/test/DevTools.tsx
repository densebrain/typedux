import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {createDevTools} from 'redux-devtools'

// import * as LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'
import {Provider} from 'react-redux'

// import * as FilterableLogMonitor from 'redux-devtools-filterable-log-monitor'


//<DiffMonitor theme='tomorrow' />
// <Inspector />
// <LogMonitor/>
//<DiffMonitor/>
const DevTools = createDevTools(

	<DockMonitor toggleVisibilityKey="ctrl-h"
	             changePositionKey="ctrl-q">
		
	</DockMonitor>
)

class Debugger extends React.Component<any,any> {

	render() {
		return <div><DevTools bottom/></div>
	}
}

// function renderDebugger(store) {
// 	const devToolsElement = document.createElement('div')
// 	const body = document.body
// 	//Object.assign(devToolsElement.style,{display:'none'})
// 	body.appendChild(devToolsElement)
//
// 	ReactDOM.render(<Provider store={store}><DevTools/></Provider>, devToolsElement)
//
// }

function showDevTools(store) {
	const popup = window.open(null, 'Redux DevTools', 'menubar=no,location=no,resizable=yes,scrollbars=no,status=no')

	// Reload in case it already exists
	popup.location.reload()

	setTimeout(() => {
		popup.document.write('<div id="react-devtools-root"></div>')
		ReactDOM.render(
			<DevTools store={store}/>,
			popup.document.getElementById('react-devtools-root')
		)
	}, 10)

}


export {DevTools, Debugger, showDevTools}
