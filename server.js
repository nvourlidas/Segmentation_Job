const express = require('express');
const { ParquetReader } = require('parquetjs-lite');
const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');
const tmp = require('tmp');
const request = require('request');
//const parquet = require('parquetjs');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const { CLIENT_SECRET,
    API_KEY,
    SCOPES,
    ACCESS_TOKEN,
    TECHNICAL_ACCOUNT_ID,
    IMS,
    IMS_ORG,
    SANDBOX_NAME,
    CONTAINER_ID
} = require('./env');




app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/token', async (req, res) => {
    try {
        const headers = {
            'Accept': '*/*',
        };

        const response = await axios.post(`https://${IMS}/ims/token/v2?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&scope=${SCOPES}`, { headers });

        const responseData = response.data.access_token;
        console.log(responseData);

        // Read existing env.js file
        let envContent = fs.readFileSync('env.js', 'utf8');

        // Find the position of ACCESS_TOKEN=
        const startIndex = envContent.indexOf('ACCESS_TOKEN=');
        if (startIndex !== -1) {
            // Find the position of the end of the line
            const endIndex = envContent.indexOf('\n', startIndex);
            // Extract the existing ACCESS_TOKEN value
            const existingToken = envContent.substring(startIndex, endIndex);
            // Replace the existing ACCESS_TOKEN value with the new token
            envContent = envContent.replace(existingToken, `ACCESS_TOKEN='${responseData}'`);
        }

        // Write updated content back to env.js
        fs.writeFileSync('env.js', envContent);

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.get('/getjob', async (req, res) => {
    try {

        const id = req.query.id
        const headers = {
            'Accept': '*/*',
            'Accept': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'x-api-key': API_KEY,
            'x-gw-ims-org-id': IMS_ORG,
            'x-sandbox-name': SANDBOX_NAME

        };


        const SEGMENT_JOB_ID = id


        const response = await axios.get(`https://platform.adobe.io/data/core/ups/segment/jobs/${SEGMENT_JOB_ID}`, { headers });


        const responseData = response.data;
        res.json({ message: responseData });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

});


app.post('/sendjob', async (req, res) => {
    try {
        const id = req.body.id;



        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'x-api-key': API_KEY,
            'x-gw-ims-org-id': IMS_ORG,
            'x-sandbox-name': SANDBOX_NAME
        };

        const requestData = [{
            "segmentId": id
        }];

        deleteFilesInDirectory('./parquet');

        const response = await axios.post('https://platform.adobe.io/data/core/ups/segment/jobs', requestData, { headers });

        const responseData = response.data;
        res.json({ message: responseData });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/parquet', async (req, res) => {
    try {

        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'x-api-key': API_KEY,
            'x-gw-ims-org-id': IMS_ORG,
            'x-sandbox-name': SANDBOX_NAME,
            'responseType': 'arraybuffer'
        };


        const audid = req.query.id;
     
        console.log(audid)

       async function someFunction() {
        try {
            const batch = await getbatch();
            console.log(batch);
            const dataSetFileId = `${batch}-DE1`
            const response = await axios.get(`https://platform.adobe.io/data/foundation/export/files/${dataSetFileId}`, { headers });
            const responseData = response.data.data;
            
            let data = [];

        // Use a flag to track completion
        let isCompleted = false;

        // Processing data
        Promise.all(responseData.map(async (item) => {
            try {
                await parq(item.name, batch);

                // Check if this is the last item
                if (item === responseData[responseData.length - 1]) {
                    isCompleted = true;
                }
            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        })).then(() => {
            // Once all items are processed, call fileread and send response
            setTimeout(() => {
                if (isCompleted) {
                    fileread(res, data, audid);
                }
            }, 5000);
        }).catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
        } catch (error) {
            console.error(error);
        }
    }
    
    someFunction()

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


async function getbatch() {
    try {
        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'x-api-key': API_KEY,
            'x-gw-ims-org-id': IMS_ORG,
            'x-sandbox-name': SANDBOX_NAME,
            'responseType': 'arraybuffer'
        }

        const datasetid = '626a518f1f7327194982b2d1'

        const response = await axios.get(`https://platform.adobe.io/data/foundation/catalog/batches?status=success&dataSet=${datasetid}`, { headers });
        //const responseData = response.data;

        const responseKeys = Object.keys(response.data);
        const firstKey = responseKeys[0]; 

        console.log(firstKey);
        
        return firstKey;
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



async function parq(item, batch) {

    try {

        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'x-api-key': API_KEY,
            'x-gw-ims-org-id': IMS_ORG,
            'x-sandbox-name': SANDBOX_NAME,
            'responseType': 'arraybuffer'
        }
        const options = {
            headers: headers
        }

        const dataSetFileId = `${batch}-DE1`

        const url = `https://platform.adobe.io/data/foundation/export/files/${dataSetFileId}?path=${item}`;
        const directory = './parquet';


        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        // Create a writable stream to save the file
        const file = fs.createWriteStream(path.join(directory, item));
        // Make the HTTP request to download the file
        https.get(url, options, (response) => {
            // Check if the response is successful (status code 200)
            if (response.statusCode === 200) {
                // Pipe the response data to the file stream
                response.pipe(file);
                // Close the file stream when the download is complete
                response.on('end', () => {
                    file.close();
                    console.log('File saved successfully.');
                });
            } else {
                console.error('Failed to download file. Status code:', response.statusCode);
            }
        })
            .on('error', (err) => {
                console.error('Error downloading file:', err);
            });

    } catch (error) {
        console.log(error)
    }

}




function fileread(res, data, audid) {
    const directoryPath = './parquet';

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (files.length === 0) {
            console.log('Directory is empty');
            res.json(data); // Send empty data array
            return;
        }

        let count = files.length;

        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
                if (stats.isFile()) {
                    parq2(file).then(records => {
                        data.push(...records);
                        count--;
                        if (count === 0) {
                            // All files processed, send response
                            // const masterIds = findMasterId(data, "_deloitteemeanorthpartnersand.nv_customedetails.Masterid", "segmentMembership.key_value[0].value.key_value.key", "059055fd-917d-4f45-985a-3da23ab6f4e6");
                            // console.log(masterIds);

                            const targetKey = audid;
                            const resultObject = findObjectsAtPositions(data, targetKey);
                            console.log(resultObject);


                            res.json(resultObject);
                        }
                    }).catch(error => {
                        console.error(error);
                        //res.status(500).json({ error: 'Internal Server Error' });
                    });
                }
            });
        });
    });
}

async function parq2(item) {
    try {
        const reader = await ParquetReader.openFile(`./parquet/${item}`);
        const cursor = reader.getCursor();
        let records = [];
        let record;
        while (record = await cursor.next()) {
            records.push(record);
            //console.log(record.segmentMembership.key_value[0].value.key_value[0].key)
        }
        return records;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


function findObjectsAtPositions(arr, targetKey) {
    let positions = [];

    function traverse(obj, position) {
        if (obj && typeof obj === 'object') {
            // Check if the object has the key field and its value matches the targetKey
            if (obj.hasOwnProperty('key') && obj.key === targetKey) {
                positions.push({ position: position[0], object: obj });
            }

            // Recursively traverse each key-value pair in the object
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    traverse(obj[key], position.concat(key)); // Append the current key to the position array
                }
            }
        }
    }

    // Iterate over each object in the array
    arr.forEach((obj, index) => {
        traverse(obj, [index]); // Initialize the position array with the current index
    });

    // Populate array with objects at found positions
    const resultArray = positions.map(({ position }) => arr[position]);

    const nestedFieldsResults = findNestedFields(resultArray, "Masterid")

    //return resultArray.length ? resultArray : null;

    return nestedFieldsResults.length ? nestedFieldsResults : null;
}



function findNestedFields(obj, targetFieldName) {
    const results = [];

    function traverse(obj) {
        if (obj && typeof obj === 'object') {
            // Check if the current object has the target field
            if (obj.hasOwnProperty(targetFieldName)) {
                results.push(obj[targetFieldName]);
            }

            // Recursively traverse each key-value pair in the object
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    traverse(obj[key]);
                }
            }
        }
    }

    traverse(obj);
    return results;
}

async function deleteFilesInDirectory(directoryPath) {
    try {
        // Get list of all files in the directory
        const files = await fs.promises.readdir(directoryPath);

        // Iterate through the files and delete them
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            await fs.promises.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
        }

        console.log('All files deleted successfully.');
    } catch (error) {
        console.error('Error deleting files:', error);
    }
}



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



