# BTP User Management Microservice
<!--- Register repository https://api.reuse.software/register, then add REUSE badge:
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/REPO-NAME)](https://api.reuse.software/info/github.com/SAP-samples/REPO-NAME)
-->

## Description
This sample code aims to help SAP developers (customers or partners) to develop **secure applications** on **SAP Business Technology Platform** using the **Authorization and Trust Management Service (XSUAA) APIs** from **Cloud Foundry**. The code is developed using the **SAP Cloud Application Programming Model (CAP) NodeJS framework** and implements a **microservice** to **manage business applications' users and their respective authorizations** with a simple **SAP Fiori Elements UI** for testing.
> **IMPORTANT NOTE**: please be aware that the code in this repository is targeted to experienced CAP developers

## Solution Architecture
![BTP User Management Microservice Architecture](https://i.imgur.com/iaa5IXO.png "BTP User Management Microservice")

## Requirements
- SAP Business Technology Platform **subaccount** (productive or trial) with **Cloud Foundry** environment enabled
- SAP Business Application Studio entitlement / subscription (**Full Stack Cloud Application Dev Space**)
- SAP Launchpad Service entitlement / subscription

## Download and Installation

### Clone the Project Repo
1. Access your **SAP Business Application Studio** full-stack cloud development **Dev Space**
2. Open a new terminal (if not yet opened): **Terminal** > **New Terminal**
3. From the default **projects** folder, create the project directory:
> **NOTE**: if you have not set the **projects** folder to become your **current workspace** in BAS your terminal might end-up in the **user** folder. So, do `cd projects` before executing the command below.   
```
mkdir user-mngr
```
3. Clone this repo into the recently created directory:
```
git clone https://github.com/SAP-samples/btp-user-management-microservice.git user-mngr
```

### Create the Required Service Instances
1. Login to **Cloud Foundry**:
```
cd user-mngr && cf login
```
2. Create the **Destination** service:
```
cf create-service destination lite dest-svc
```
3. Create the **XSUAA** service (**application plan**):
```
cf create-service xsuaa application xsuaa-svc -c xs-security.json
```
4. Create the **XSUAA** service (**apiaccess plan**):
```
cf create-service xsuaa apiaccess xsuaa-api
```
5. Create the **XSUAA** service (**apiaccess plan**) **service key**:
```
cf create-service-key xsuaa-api xsuaa-api-sk
```

### Bind Destination and XSUAA (application) Services to the CAP Project
1. Temporarily rename the **.env** file to **default.env**:
```
mv .env default.env
```
2. On the **left-hand pane** of BAS click on the **Cloud Foundry: Targets** icon (small lightbulb)
3. Expand the **Services** node
4. Right-click the **dest-svc (destination)** item
5. Select **Bind a service to a locally run application**
6. In the **dialog** select the **user-mngr** directory
7. Click **Select folder for .env file**
8. Repeat steps 4 to 7 for the **xsuaa-svc (xsuaa)** item
9. Go back to the **Explorer**, open the **recently created .env** file and adjust its contents to become a JSON object like demonstrated below:
<p align="center"><img src="https://i.imgur.com/VYqDurS.png" alt="VCAP_SERVICES JSON object"/></p>

10. Rename the **.env** file to **default-env.json**:
```
mv .env default-env.json
```
> **HINT**: you can open the **recently renamed file** (default-env.json) and format the JSON content with **ALT+Shift+F** for better visualization.
11. Rename the **default.env** file back to **.env**
```
mv default.env .env
```

### Install Project Dependencies
1. Setup **npm registry**:
```
npm config set registry https://registry.npmjs.org/
```
> **NOTE**: this is important to avoid issues when running `npm clean-install` in the MTA build process.
2. Install **service dependencies**:
```
npm install
```
3. Install **UI dependencies**:
```
cd app/user-mngr && npm install && cd ../..
```

### Create the Destination to the XSUAA API
1. Display the **XSUAA (apiaaccess plan) service key**:
```
cf service-key xsuaa-api xsuaa-api-sk
```
2. Take note (**copy**) the following **service key properties**:
 - apiurl
 - clientid
 - clientsecret
 - url
3. Open the **BTP cockpit** and access **your subaccount** (same subaccount used to start the **BAS Dev Space**)
4. On the **left-hand pane** expand the **Connectivity** node
5. Click on **Destinations**
6. Click on **New Destination**
7. Fill-in the **required information** like demonstrated below:
<p align="center"><img src="https://i.imgur.com/YOMu9hd.png" alt="XSUAA API destination"/></p>

8. Click **Save**

### Assign the Application's Role Collections to Your User
1. Open the **BTP cockpit** and access **your subaccount** (same subaccount used to start the **BAS Dev Space**)
2. On the **left-hand pane** expand the **Security** node
3. In the **users list** on the right, click on **your user**
> **HINT**: if the users list is to long and you find it difficult to locate your user, you can **use the search box** at the top.
4. In the **user's details** at the right, click on **Assign Role Collection**
5. Find the role collections starting with **GenericApp**
6. Check both **role collections**
7. Click on **Assign Role Collection**

### Test Application Locally
1. **Start** the application in BAS:
```
cds watch
```
2. **CTRL+Click** the **http://localhost:4004** link in the terminal to open the **service home page** in a new tab
> **NOTE**: you must **allow pop-ups** for your **BAS URL** in your browser in order to get the new tab to be properly opened.
3. Click on the **User** link
4. When prompted to **Sign in** type **john** as the **Username** and click **Sign in**
5. You should see the **information from your user** in JSON format like demonstrated below:
<p align="center"><img src="https://i.imgur.com/DQUnWGg.png" alt="User information"/></p>

6. Click on the other two links (**IdP** and **Authorization**) to check whether they are working fine as well
7. In the **Terminal** press **CTRL+C** to terminate the service

### Deploy Application to Cloud Foundry
1. From the **Explorer** open the **mta.yaml** file
2. Search for the **[your BTP subdomain]** string and replace it with the **subdomain** of **your BTP subaccont**
> **HINT**: you can find the **subdomain name** in the **Overview** page of your subaccount in the **BTP cockpit**
3. In the **Explorer** right-click on the **mta.yaml** file and select **Build MTA Project**
4. When the build process finishes, an **mta_archives** directory will appear in the **Explorer**
6. Expand the **mta_archives** directory
7. Right-click the  **user-mngr_1.0.0.mtar** and select **Deploy MTA Archive**

### Set the Application's Environment Variables
1. Set the **APP_AUTHS** environment variable:
```
cf set-env user-mngr-srv APP_AUTHS '{ "ID": 1, "name": "GenericApp_Administrator", "description": "Administrator of a generic application" }|{ "ID": 2, "name": "GenericApp_User", "description": "User of a generic application" }'
```
2. Set the **DEFAULT_AUTH** environment variable:
```
cf set-env user-mngr-srv DEFAULT_AUTH 2
```
3. **Restage** the service:
```
cf restage user-mngr-srv
```

### Test the Application in Cloud Foundry
1. On the **left-hand pane** of your **BTP cockpit**, click on **HTML5 applications**
> **NOTE**: the applications will be listed only if you have at least **SAP Launchpad Service** enabled in your subaccount (please, see the **Requirements** section).
2. Click on the **usermngr** link
3. The **Fiori Elements UI** of the service will open in a new tab
4. You can use this UI to **fully test** the microservice: **create**, **update** and/or **delete** users of your application (users who have the **GenericApp role collections** assigned)

> **FINAL NOTE**: having the application deployed to the **HTML5 apps repository** you can optionally add it to a **SAP Launchpad Service site**.

## Known Issues
No known issues.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
