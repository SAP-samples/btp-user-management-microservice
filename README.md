# BTP User Management Microservice
<!--- Register repository https://api.reuse.software/register, then add REUSE badge:
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/REPO-NAME)](https://api.reuse.software/info/github.com/SAP-samples/REPO-NAME)
-->

## Description
This sample code aims to help SAP developers (customers or partners) to develop **secure applications** on **SAP Business Technology Platform** using the **Authorization and Trust Management Service (XSUAA) APIs** from **Cloud Foundry**. The code is developed using the **SAP Cloud Application Programming Model (CAP) NodeJS framework** and implements a **microservice** to **manage business applications' users and their respective authorizations** with a simple **SAP Fiori Elements UI** for testing.

## Solution Architecture
![BTP User Management Microservice Architecture](https://i.imgur.com/iaa5IXO.png "BTP User Management Microservice")

## Requirements
- SAP Business Technology Platform **productive subaccount** (user management is not possible on trial) with Cloud Foundry environment enabled
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
4. Create the **XSUAA** service (**apiaccess plan**) and a respective **service key**:
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
2. On the **left-hand pahe** of BAS click on the **Cloud Foundry: Targets** icon (small lightbulb)
3. Expand the **Services** node
4. Right-click the **dest-svc (destination)** item
5. Select **Bind a service to a locally run application**
6. In the **dialog** select the **user-mngr** directory
7. Click **Select folder for .env file**
8. Repeat steps 4 to 7 for the **xsuaa-svc (xsuaa)** item
9. Go back to the **Explorer**, open the **recently created .env** file and adjust its contents to become a JSON object like demonstrated below:

<div style="text-align:center"><img src="https://i.imgur.com/VYqDurS.png" alt="VCAP_SERVICES JSON object"/></div>.
<!-- ![VCAP_SERVICES JSON object](https://i.imgur.com/VYqDurS.png "VCAP_SERVICES JSON object") -->

10. Rename the **.env** file to **default-env.json**:
```
mv .env default-env.json
```
> **HINT**: you can open the **recently renamed file** (default-env.json) and format the JSON content with **ALT+Shift+F** for better visualization.
11. Rename the **default.env** file back to **.env**
```
mv default.env .env
```

### Create the Destination to the XSUAA API


## Known Issues
No known issues.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
