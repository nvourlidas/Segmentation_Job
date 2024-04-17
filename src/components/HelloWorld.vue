<template>
  <alertOne v-if="alert"></alertOne>
  <alertTwo v-if="alert2"></alertTwo>
  <div class="form-container">
    <form @submit.prevent="CreateJob">
      <label for="text">Give Audience ID:</label>
      <input type="text" id="text" v-model="audid">
      <button @click="vis = false" type="submit" :disabled="dis2" :class="{ 'disabled-button': dis2 }">Send</button>
    </form>
  </div><br>
  <button @click="GetJob()" class="segmentation-button" >Get Segmentation Job</button><br>
  <div v-if="vis2" class="wait">
    <p class="message">Evaluation has not ben=en completed yet. This proccess will take a couple of minutes. Please wait.
    </p>
    <!-- <div class="lds-dual-ring"></div> -->
    <SpinnerLoad />
  </div>
  <div v-if="vis" class="result-container">
    <h4 class="result-heading">Audience ID: {{ res.segments[0].segmentId }}</h4>
    <h4 class="result-heading">Job Status: {{ res.status }}</h4>
    <h4 class="result-heading">Evaluation Date and Time: {{ time }}</h4>
    <h4 v-for="(value, key) in res.metrics.segmentedProfileCounter" :key="key" class="metric">
      <span class="key">Total Profiles Qualified:</span> <span class="value">{{ value }}</span>
    </h4>
    <button @click="GetIDs" class="segmentation-button"> Get Profiles Masterids</button>
    <div v-if="loading">
      <div class="lds-dual-ring"></div>
    </div>
    <ul v-else class="custom-list">
      <li v-for="(value, key) in ids" :key="key">{{ value }}</li>
    </ul>
  </div>
</template>

<script>
/* eslint-disable */
import axios from 'axios';
import SpinnerLoad from './SpinnerLoad.vue';
import alertOne from './alertOne.vue';
import alertTwo from './alertTwo.vue';



export default {
  name: 'HelloWorld',

  components: {
    SpinnerLoad,
    alertOne,
    alertTwo
  },

  data() {
    return {
      //audid: '',
      audid: 'faf5c147-7803-43b1-96df-3223ffd59e9e',
      res: [],
      vis: false,
      vis2: false,
      profiles: '',
      time: '',
      jobid: sessionStorage.getItem('jobid'),
       //jobid: '430898c0-2931-4d73-9070-f0dfaf6c5ad1',
      ids: [],
      loading: false,
      alert: false,
      alert2: false,
      dis: false,
      dis2: false,
    }
  },

  created() {
    axios.get('/token')
  },

  methods: {
    CreateJob() {
      axios.post('/sendjob', {
        id: this.audid
      }).then(res => {
        sessionStorage.setItem('jobid', res.data.message.id),
        this.jobid = res.data.message.id,
        this.alert = true,
        this.dis2 = true
      }).catch(error => {
        this.alert2 = true
        console.error('Error creating job:', error);
      });
      console.log(this.audid)
    },


    GetJob() {
      this.dis = true;
      const fetchJobStatus = () => {
        axios.get('/getjob', {
          params: { id: this.jobid }
        }).then(res => {
          this.res = res.data.message;
          if (res.data.message.status == 'SUCCEEDED') {
            clearInterval(intervalId);
            this.vis = true;
            this.vis2 = false;

            const timestamp = res.data.message.updateTime;
            const date = new Date(timestamp);
            const currentTime = date.toLocaleString();

            this.time = currentTime
          } else {
            this.vis2 = true;
          }
        }).catch(error => {
          console.error('Error fetching job status:', error);
        });
      };

      fetchJobStatus();

      const intervalId = setInterval(fetchJobStatus, 30000);
     

      console.log('Works');
    },

    // GetIDs(){
    //   axios.get('/parquet', {
    //       params: { id: this.audid }
    //     }).then(res => this.ids = res.data)
    // }

    async GetIDs() {
      try {
        this.loading = true; // Set loading to true before making the API call
        const response = await axios.get('/parquet', { params: { id: this.audid } });
        this.ids = response.data; // Assign data from API response to ids array
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        this.loading = false; // Set loading to false after API call is completed
      }
    }
  }

}
</script>

<style scoped>
.form-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

input[type="text"] {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

button[type="submit"] {
  width: 100%;
  padding: 10px;
  background-color: #86BC25;
  color: #fff;
  font-size: large;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}


.result-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.result-heading {
  font-size: 18px;
  margin-bottom: 10px;
}

.metric {
  margin-bottom: 5px;
}

.key {
  font-weight: bold;
}

.value {
  margin-left: 10px;
}


.wait {
  background-color: #ffffffbb;
  color: #180a0c;
  padding: 10px;
  /* border: 1px solid #b6b6b6c9;
  border-radius: 5px; */
  margin-top: 20px;
}

.wait .message {
  margin: 0;
}

.segmentation-button {
  background-color: #007bff;
  /* Blue background color */
  color: #fff;
  /* White text color */
  padding: 10px 20px;
  /* Padding around the text */
  border: none;
  /* No border */
  border-radius: 5px;
  /* Rounded corners */
  cursor: pointer;
  /* Show pointer cursor on hover */
  transition: background-color 0.3s;
  /* Smooth transition for background color change */
}

.segmentation-button:hover {
  background-color: #0056b3;
  /* Darker blue on hover */
}


.lds-dual-ring,
.lds-dual-ring:after {
  box-sizing: border-box;
}

.lds-dual-ring {
  margin-top: 50px;
  display: inline-block;
  width: 80px;
  height: 80px;
}

.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6.4px solid currentColor;
  border-color: currentColor transparent currentColor transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}

.custom-list {
  list-style-type: none;
  padding: 0;
}

.custom-list li {
  padding: 5px;
  background-color: #f0f0f0;
  margin-bottom: 5px;
}

.disabled-button {
  opacity: 0.5;
  cursor:default;
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
