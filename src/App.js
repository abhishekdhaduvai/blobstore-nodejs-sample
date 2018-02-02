import React, { Component } from 'react';
import { Route, Link, Switch, Redirect } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import axios from 'axios';

class App extends Component {

  render() {
    return (
      <div className='App'>
        <px-branding-bar />

        <Switch>
          <Route exact path='/dashboard' component={Dashboard} />
          <Route path='/' render={() => {
            return <Redirect to='/dashboard' />
          }}/>
        </Switch>
      </div>
    );
  }
}

export default App;
