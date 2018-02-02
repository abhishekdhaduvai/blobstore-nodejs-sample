import React from 'react';
import axios from 'axios';
import KeyValue from '../web-components/KeyValue';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import UploadFile from './UploadFile';
import Contents from './Contents';

class Dashboard extends React.Component {

  state = {
    contents: undefined,
    error: false,
    errorMessage: '',
    loading: false,
    done: false,
    doneMessage: '',
  }

  componentDidMount(){
    this.setState({
      loading: true,
      loadingText: `Getting files in the bucket`
    });
    axios.get('/blob')
    .then(res => {
      this.setState({
        loading: false,
        contents: res.data.Contents
      });
    })
    .catch(err => {
      this.setState({
        loading: false,
        error: true,
        errorMessage: err.response.data
      })
    })
  }

  deleteFile = (filename) => {

    this.setState({
      loading: true,
      loadingText: `Deleting ${filename}`
    });

    axios.delete(`/blob/${filename}`)
    .then(res => {
      let temp = this.state.contents.filter(file => file.Key !== filename);      
      this.setState({
        loading: false,
        contents: temp,
        done: true,
        doneMessage: res.data,
      });
    })
    .catch(err => {
      this.setState({
        error: true,
        errorMessage: err.response.data
      })
    })
  }

  render() {
    return (
      <div className='container'>

        {this.state.loading && 
          <div style={styles.loading}>
            <div style={{textAlign: 'center'}}>
              <px-spinner />
              <p>{this.state.loadingText}</p>
            </div>
          </div>
        }

        {this.state.done &&
          <px-alert-message
            visible
            type='information'
            action='dismiss'
            message-title='Done!'
            message={this.state.doneMessage}
            auto-dismiss='3000'>
          </px-alert-message>
        }

        {this.state.error && 
          <px-alert-message
            visible
            type='important'
            action='acknowledge'
            message-title='Error!'
            message={this.state.errorMessage}
            auto-dismiss='0'>
          </px-alert-message>
        }

        <section style={styles.heading}>
          <div>Predix BlobStore Service Demo - JavaScript</div>
        </section>

        <section className='flex'>
          <div style={{flex:1, background: '#f7f7f7', borderRight: '1px solid #e0e0e0'}}>
            <UploadFile/>
          </div>

          {this.state.contents !== undefined && 
            <div style={{flex:4, background: '#f7f7f7'}}>
              <Contents contents={this.state.contents} deleteFile={this.deleteFile}/>
            </div>
          }
        </section>

      </div>
    )
  }
}

const styles = {
  loading: {
    background: 'white',
    opacity: 0.8,
    display: 'flex',
    position: 'fixed',
    top:0,
    height: '100%',
    width: '100%',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  heading: {
    padding: '1em',
    background: '#fafafa',
    fontSize: '2em',
    fontWeight: 'bold',
    color: '#424242'
  }
}

export default Dashboard;