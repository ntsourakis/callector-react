import React, { Component } from 'react';
import axios from 'axios';

//import ReactBootstrap, {Jumbotron, Button, Col, Grid, Panel, FormGroup} from 'react-bootstrap'
import Button from 'react-bootstrap/Button'
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import PropTypes from "prop-types";
import SpeechRecognition from "react-speech-recognition";

var Querystring = require('querystring');

const propTypes = {
	// Props injected by SpeechRecognition
	transcript: PropTypes.string,
	resetTranscript: PropTypes.func,
	browserSupportsSpeechRecognition: PropTypes.bool,	
	recognition: PropTypes.object
};

// Options for the recognizer
const options = {
  autoStart: true
}

// 
class App extends Component {
  
	// State info
	state = {
		token: "",
		title: "numbergame",
		st: "",
		games: ["numbergame", "whichanimal", "whichmovie", "whichlanguage", "lettergame"],
		game: "numbergame",
		prompt: "",
		match: "",
		response: ""
	};

	constructor(props) {
		
		super(props);

		//const { recognition } = this.props
			
		// This binding is necessary to make `this` work in the callback
		this.getNextPrompt = this.getNextPrompt.bind(this);
		this.getBackPrompt = this.getBackPrompt.bind(this);
		this.responseChange = this.responseChange.bind(this);
		this.responseSubmit = this.responseSubmit.bind(this);		
		this.gameChange = this.gameChange.bind(this);
		this.gameSubmit = this.gameSubmit.bind(this);		
		//recognition.onspeechstart = this.onSpeechStart.bind(this);
        //recognition.onspeechend = this.onSpeechEnd.bind(this);
		//recognition.onresult = this.onSpeechResult.bind(this);
	}
  
	//
	componentWillMount() {
		
		const { recognition } = this.props
		
		recognition.continous = true
		recognition.interimResults = false
		recognition.lang = 'it-IT'
		
		
		//recognition.onspeechstart = event => {
		//	this.setState({response: ""});		
		//}
		
		recognition.onresult = event =>	{
			
			console.log("onresult: ", event.results[0][0].transcript);
			//this.setState({response: event.results[0][0].transcript});
			
			let finalTranscript = ''		
			let interimTranscript = ''

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
		
				if (event.results[i].isFinal) 
					finalTranscript += transcript + ' ';
				else 
					interimTranscript += transcript;
			}
		  
			console.log("interimTranscript: ", interimTranscript);
			console.log("finalTranscript: ", finalTranscript);
			document.getElementById('interim').innerHTML = interimTranscript
			document.getElementById('final').innerHTML = finalTranscript
			
			this.setState({response: finalTranscript});
			this.match(finalTranscript);
		}
			
		//console.log("Result:", event.results[0][0].transcript);
		//recognition.onspeechend = event =>
		//	this.match(this.state.response)
		//	console.log("Result:", event);
		//recognition.lang = 'el-GR'
	}
  
	// Ready to send the requests
	componentDidMount() {
			
		// Authenticate the user
		this.authenticate();
	}
	
	// Authenticate
	authenticate() {
		const data = {
			//grant_type: USER_GRANT_TYPE,
			//client_id: CLIENT_ID,
			//client_secret: CLIENT_SECRET,
			//scope: SCOPE_INT,
			
			username: 'admin',
			password: 'admin'
		};

		/*const params = {
	  
			headers: { 
				'Access-Control-Allow-Origin':'*', 
				'Access-Control-Allow-Headers': 'Content-Type,Authorization', 
				'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,OPTIONS' 
			}
		}*/
	  
		axios.post('http://callector-django.herokuapp.com/' + this.state.game + '/api-token-auth/', Querystring.stringify(data))   
		.then(response => {
			console.log('api-token-auth ' + response.data.token);
			this.setState({ token:response.data.token}, function() {
				this.init();
			});
		})   
		.catch((error) => {
			console.log('error ' + error);   
		});
	}
	
	// Initialize
	init() {
	  
	    const AuthStr = 'Token '.concat(this.state.token);
		
		axios.get('http://callector-django.herokuapp.com/' + this.state.game + '/init/', { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('init: ' + response.data);
			this.setState({prompt: response.data}, function() {				
			});	
			//this.setState({st: response.data.state}, function() {
			//	this.getLessons();
			//});		
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}

	// Get Lessons
	getLessons() {
	  
		const AuthStr = 'Token '.concat(this.state.token);
		
		axios.post('http://callector-django.herokuapp.com/numbergame/message/', {"message":["get_available_lessons"], "state":this.state.st}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('lessons: ' + response.data.lessons);	
			// Store the current lesson
			this.setState({lesson: this.state.lessons[0]})
			// Set the current lesson
			this.setState({lessons: response.data.lessons}, function() {
				this.setLesson(this.state.lessons[0]);
			});		
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}
	
	// Set Lesson
	setLesson(lesson) {
	  
		const AuthStr = 'Token '.concat(this.state.token); 
	
		console.log('lesson: ' + lesson);
		
		axios.post('http://callector-django.herokuapp.com/numbergame/message/', {"message":["set_lesson_by_name", lesson], "state":this.state.st}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('prompt: ' + response.data.text);
			this.setState({prompt: response.data.text});			
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}

	// A new game was chosen
	gameChange(event) {
		this.setState({game: event.target.value});
		//console.log('game: ' + this.state.game);
		//this.authenticate()
	}
	
	// A new game was requested
	gameSubmit(event) {
		
		event.preventDefault();
		
		this.setState({title: this.state.game});
		// Reset the controls
		this.setState({prompt: ""});
		this.setState({match: ""});
		this.setState({response: ""});
		document.getElementById('final').innerHTML = "Recresult"
		
		//this.setGame(this.state.game);
		this.authenticate()
	}

	// Get help file
	getHelpFile() {
	  
		const AuthStr = 'Token '.concat(this.state.token);
		
		axios.post('http://callector-django.herokuapp.com/numbergame/message/', {"message":["help_file"], "state":this.state.st}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			// TODO: Find the correct field
			//console.log('help file: ' + response.data.);			
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}

	// Match sentence
	match(sentence) {
	
		const AuthStr = 'Token '.concat(this.state.token);
		
		console.log(sentence);
	
		axios.post('http://callector-django.herokuapp.com/' + this.state.game + '/message/', {"message":sentence.toLowerCase().trim()}, { headers: { Authorization: AuthStr } })
		//axios.post('http://callector-django.herokuapp.com/numbergame/message/', {"message":["match", sentence.toLowerCase().trim()], "state":this.state.st}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('prompt: ' + response.data);
			this.setState({prompt: response.data});			
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}
		
	// A new response was provided
	responseChange(event) {
		this.setState({response: event.target.value});
	}
	
	// Submit a text response
	responseSubmit(event) {
		
		event.preventDefault();
		this.match(this.state.response);
	}

	// Next
	getNextPrompt() {
	  
		const AuthStr = 'Token '.concat(this.state.token);

		// Clear previous info
		this.setState({response: ""});		
		this.setState({match: ""});
		document.getElementById('final').innerHTML = "&nbsp;"
			
		axios.post('http://callector-django.herokuapp.com/' + this.state.game + '/message/', {"message":"next"}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('prompt: ' + response.data);
			this.setState({prompt: response.data});					
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}

	// Back
	getBackPrompt() {
	  
		const AuthStr = 'Token '.concat(this.state.token);

		// Clear previous info
		this.setState({response: ""});
		this.setState({match: ""});
		document.getElementById('final').innerHTML = "&nbsp;"
		
		axios.post('http://callector-django.herokuapp.com/' + this.state.game + '/message/', {"message":"back"}, { headers: { Authorization: AuthStr } })
		.then(response => {
			// If request is good...
			console.log('prompt: ' + response.data);
			this.setState({prompt: response.data});					
		})
		.catch((error) => {
			console.log('error ' + error);
		});
	}
	
	/*onSpeechStart(e) {
		console.log('onSpeechStart ');
	}
	
	onSpeechEnd(e) {
		console.log('onSpeechEnd ');
	}

	onSpeechResult(e) {
		console.log(onSpeechResult);
	}*/
  
  /*
  getLessons() {
    axios
      .get('http://callector-django.herokuapp.com/api/')
      .then(res => {
        this.setState({ todos: res.data });
      })
      .catch(err => {
        console.log(err);
      });
  }*/

  
			/*<ButtonToolbar>
				<Button variant="primary" onClick="back()">Back</Button>
				<Button variant="secondary">Next</Button>
			</ButtonToolbar>*/
			
	render() {
		
		const { transcript, resetTranscript, browserSupportsSpeechRecognition } = this.props

		if (!browserSupportsSpeechRecognition) {
		
			return null
		}
		
		return (

		<div>
			<h3>{this.state.title}</h3>
			<p>
				Token:&nbsp; {this.state.token}
			</p>
		
			<form onSubmit={this.gameSubmit}>
				<label>
					Games:&nbsp;
					<select value={this.state.game} onChange={this.gameChange}>
						{this.state.games.map(game => <option key={game}>{game}</option>)}
					</select>
				</label>
				<input type="submit" value="Submit" />
			</form>
		
			<p>
				Prompt:&nbsp; {this.state.prompt}
			</p>		
			
			<button onClick={this.getBackPrompt}>Back</button>&nbsp;&nbsp;&nbsp;
			<button onClick={this.getNextPrompt}>Next</button>
			
			<p></p>
		
			<div id='final'>Recresult</div>
			<div id='interim'></div>
			
			<p></p>
			
			<form onSubmit={this.responseSubmit}>
				<label>
					Test a phrase:&nbsp;
					<input size="50" type="text" onChange={this.responseChange} />
				</label>
				<input type="submit" value="Submit" />
			</form>
						
		</div>
		
	);
	}
}

//<button onClick={resetTranscript}>Reset</button>
//<span>&nbsp;{transcript}</span>	

// <div id='final' ></div>
// <div id='interim'></div>

//<input size="50" type="text" value={transcript} onChange={this.responseChange} />
//<button onClick={resetTranscript}>Reset</button>
//<span>{transcript}</span>
			
//export default App;
App.propTypes = propTypes;
export default SpeechRecognition(options)(App);

/*
const Dictaphone = ({
	transcript,
	resetTranscript,
	browserSupportsSpeechRecognition
		}) => {
			if (!browserSupportsSpeechRecognition) {
				return null;
		}

	return (
		
		<div>
			<button onClick={resetTranscript}>Reset</button>
			<span>{transcript}</span>
		</div>
	);
};

Dictaphone.propTypes = propTypes;
export default SpeechRecognition(Dictaphone);
*/

/*
onChangeLanguage(localeString) {
  const { recognition } = this.props
  recognition.lang = localeString
}
*/