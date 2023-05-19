# SAP BTP User Management Microservice (Multi-tenant Version)
[![License: Apache2](https://img.shields.io/badge/License-Apache2-green.svg)](https://opensource.org/licenses/Apache-2.0)
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/btp-user-management-microservice)](https://api.reuse.software/info/github.com/SAP-samples/btp-user-management-microservice)

## Description
This sample code aims to help SAP developers (customers or partners) to develop **secure applications** on **SAP Business Technology Platform** using the **Authorization and Trust Management Service (XSUAA) APIs** from **Cloud Foundry**. The code is developed using the **SAP Cloud Application Programming Model (CAP) NodeJS framework** and implements a **microservice** to **manage business applications' users and their respective authorizations** with a simple **SAP Fiori Elements UI** for testing. This version of the microservice is **multi-tenant enabled**.
> **IMPORTANT NOTE**: please be aware that the code in this repository is targeted to experienced CAP developers and is provided as is, serving exclusively as a reference for further developments

## Solution Architecture
![BTP User Management Microservice Architecture](https://i.imgur.com/en5QXKw.png "BTP User Management Microservice (Multi-tenant Version)")

## Requirements
- SAP Business Technology Platform **subaccount** (productive or trial) with **Cloud Foundry** environment enabled
- SAP Business Application Studio entitlement / subscription (**Full Stack Cloud Application Dev Space**)

## Download and Installation

### Clone the Project Repo
1. Access your **SAP Business Application Studio** full-stack cloud development **Dev Space**
2. Open a new terminal (if not yet opened): **Terminal** > **New Terminal**
3. From the default **projects** folder, create the project directory:
> **NOTE**: if you have not set the **projects** folder to become your **current workspace** in BAS your terminal might end-up in the **user** folder. So, do `cd projects` before executing the command below.   
```
mkdir user-mngr-mtx
```
3. Clone this repo branch into the recently created directory:
```
git clone -b multitenant https://github.com/SAP-samples/btp-user-management-microservice.git user-mngr-mtx
```

### Create the Required Service Instances
1. Login to **Cloud Foundry**:
```
cd user-mngr-mtx && cf login
```
2. Create the **Destination** service:
```
cf create-service destination lite dest-svc
```
3. Create the **XSUAA** service (**application plan**):
```
cf create-service xsuaa application user-mngr-mtx-uaa -c xs-security.json
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
2. On the **left-hand pane** of BAS click on the **Cloud Foundry** icon (small lightbulb)
3. Expand the **Services** node
4. Right-click the **dest-svc (destination)** item
5. Select **Bind a service to a locally run application**
6. From the **directories list** select the **user-mngr-mtx** directory and click **OK**
7. Repeat steps 4 to 6 for the **user-mngr-mtx-uaa (xsuaa)** item
8. Go back to the **Explorer**, open the **recently created .env** file and adjust its contents to become a JSON object like demonstrated below:
<p align="center"><img src="https://i.imgur.com/VYqDurS.png" alt="VCAP_SERVICES JSON object"/></p>

9. Rename the **.env** file to **default-env.json**:
```
mv .env default-env.json
```
> **HINT**: you can open the **recently renamed file** (default-env.json) and format the JSON content with **ALT+Shift+F** for better visualization.
10. Rename the **default.env** file back to **.env**
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
2. On the **left-hand pane** expand the **Security** node and click on **Users**
3. In the **users list** on the right, click on **your user**
> **HINT**: if the users list is to long and you find it difficult to locate your user, you can **use the search box** at the top.
4. In the **user's details** at the right, click on **Assign Role Collection**
5. Find the role collections starting with **GenericMtxApp**
6. Check both **role collections**
7. Click on **Assign Role Collection**

### Test Application Locally
1. **Start** the application in BAS:
```
cds watch
```
2. From the **BAS options menu** select **Terminal** then **Split Terminal**
3. In the new terminal prompt run:
```
cds subscribe t1 --to http://localhost:4004 -u john:
```
4. **CTRL+Click** the **http://localhost:4004** link in the first terminal to open the **service home page** in a new tab
> **NOTE**: you must **allow pop-ups** for your **BAS URL** in your browser in order to get the new tab to be properly opened.
5. Click on the **User** link
6. When prompted to **Sign in** type **john** as the **Username** and click **Sign in**
7. You should see the **information from your user** in JSON format like demonstrated below:
<p align="center"><img src="https://i.imgur.com/DQUnWGg.png" alt="User information"/></p>

8. Click on the other two links (**IdP** and **Authorization**) to check whether they are working fine as well
9. In the **Terminal** press **CTRL+C** to terminate the service

### Deploy Application to Cloud Foundry
1. From the **Explorer** open the **mta.yaml** file
2. Search for the **[your BTP subdomain]** string and replace it with the **subdomain** of **your BTP subaccont**
> **HINT**: you can find the **subdomain name** in the **Overview** page of your subaccount in the **BTP cockpit**
3. In the **Explorer** right-click on the **mta.yaml** file and select **Build MTA Project**
4. When the build process finishes, an **mta_archives** directory will appear in the **Explorer**
6. Expand the **mta_archives** directory
7. Right-click the  **user-mngr-mtx_1.0.0.mtar** and select **Deploy MTA Archive**

### Setup the CF Controller API destination (for automatic routes creation on subscription)
1. After the application is successfully deployed, open the **BTP cockpit** and access **your subaccount** (same subaccount used to start the **BAS Dev Space**)
2. On the **left-hand pane** click on **Instances and Subscriptions**
3. Using the **search box**, search for **user-mngr-mtx-dest**
4. Click on the **user-mngr-mtx-dest** link (a page will open in a **new tab**)
5. On the **left-hand pane** click on **Destinations**
6. Click on the "**small pencil**" on the far right of the **user-mngr-mtx-app-cfapi** destination to edit it
7. Replace the word "**login**" in the **Token Service URL** by "**uaa**"
8. Set the **User** (username) and **Password** of a **Technical User** who is a member of the **Cloud Foundry Space** where you deployed the microservice, with the "**Space Developer**" permission
> **IMPORTANT NOTE**: **never use your own credentials** for that kind of technical setup and make sure your **technical user is properly included as a member of the CF space with the Space Developer permission**, otherwise the **routes to the application for the different tenants won't be automatically created**.
9. Leave the **Client ID** as **cf**, set any dummy text as **Client Secret** and click on the **Save** button at the bottom
10. Click on the **Edit** button, clean-up the **Client Secret** (make sure to leave it blank) and click again on the **Save** button

### Test the Application in Cloud Foundry - Part 1: View Provider Users
1. Open the **BTP cockpit** 
2. Go back to your **global account** page and create a **new subaccount** in the same region of the **provider subaccount** where you deployed the microservice
3. Access the **newly created subaccount**
4. On the **left-hand pane** click on **Instances and Subscriptions**
5. Click on the **Create** button on the **top right**
6. In the **dialog**, serch for the **Generic Multi-tenant Application** in the **dropdown list** and click on the **Create** button at the bottom
7. After successfully subscribed, on the **left-hand pane** expand the **Security** node and click on **Users**
8. In the **users list** on the right, click on **your user**
> **HINT**: if the users list is to long and you find it difficult to locate your user, you can **use the search box** at the top.
9. In the **user's details** at the right, click on **Assign Role Collection**
10. Find the role collections starting with **GenericMtxApp**
11. Check both **role collections**
12. Click on **Assign Role Collection**
> **NOTE**: you had to do this assignment again in the subscriber subaccount in order to have the appropriate permission to access the application from there.
13. On the **left-hand pane** click on **Instances and Subscriptions**
14. Click on the **Go to Application** icon next to the **Generic Multi-tenant Application** subscription. The application will open in a **new tab**.
> **NOTE**: at this moment you'll see the users from the **provider subaccount** where you the deployed the microservice (actually, only your own user as it's the one you assigned the **GenericMtxApp role collections** in the provider).

### Test the Application in Cloud Foundry - Part 2: View Subscriber Users
1. Go back to the **BTP cockpit**
2. On the **left-hand pane** click on **Overview**
3. Click on the **Enable Cloud Foundry** button
5. In the **dialog** provide an appropriate **Instance Name** and **Org Name** and click on the **Create** button at the bottom
6. After **Cloud Foundry** has been successfully enabled, click on the **Create Space** button on the right
7. Set an appropriate **Space Name** and click on the **Create** button at the bottom
8. After the **CF Space** has been successfully created, on the **left-hand pane**, click on **Instances and Subscriptions**
9. Click on the **Create** button on the **top right**
10. In the **dialog**, serch for the **Authorization and Trust Management Service** in the **dropdown list**
11. In the **second dropdown list** select the **apiaccess** plan
12. Set **xsuaa-api** as the **Instance Name** and click on the **Create** button at the bottom
13. After the **XSUAA service instance** has been successfully created, on the **left-hand pane**, click on the **three dots** button at the far right of it and select ***Create Service Key**
14. Set **xsuaa-api-key** as the **Service Key Name** and click on the **Create** button at the bottom
15. After the **service key** has been successfully created, click on it (service key name link) to view its contents
16. Take note (**copy**) the following **service key properties**:
 - apiurl
 - clientid
 - clientsecret
 - url
17. Click the **Close** button at the bottom
18. On the **left-hand pane** expand the **Connectivity** node
19. Click on **Destinations**
20. Click on **New Destination**
21. Fill-in the **required information** like demonstrated below:
<p align="center"><img src="https://i.imgur.com/YOMu9hd.png" alt="XSUAA API destination"/></p>

22. Click **Save**
23. Go back to the **User Management** app subscription and hit the **Refresh** button
> **NOTE**: you might get consused after the list report is refreshed as you'll see your own user again, but don't worry, beacuse that user is the **subscriber subaccount** user which is actually the only one that exists on it (as the subaccount has been recently created) and you assigned yourself the **GenericMtxApp role collections** before accessing the subscription.
24. Create a **new user** using the **User Management** app's UI
25. Go back to the **BTP cockpit**
26. On the **left-hand pane** expand the **Security** node and click on **Users**
> **NOTE**: you should now see the two users of your application (yours and the recently created one). This proves that, now, the microservice subscription is controlling the users from the **subscriber subaccount** instead of the provider (you can check it by going back to the **provider subaccount** and viewing the **users list** there).

## Code Details

You can find a detailed explanaton about the code of this project in [**this blog post**](https://blogs.sap.com/2022/09/22/build-a-user-management-microservice-in-btp-with-cap).

## Known Issues
No known issues.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
