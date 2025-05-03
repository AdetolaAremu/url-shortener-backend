## Clone the Application

To clone this application, just make use of

```bash
git clone https://github.com/AdetolaAremu/url-shortener-backend.git
```

## 1. We need to install some NPM packages first

```js
npm i
```

This will install the packages required to run this application.

## 2. ENVIRONMENT VARIABLES

You need environment variables for the code to work effectively. So please copy the values in ".env.example" then create ".env" in the root folder, paste the values that you copied from ".env.example"

## 2. NOE BEFORE RUNNING THE APPLICATION

Take note that the express version in this application is v5. In v5 the wildcard is now "/_splat" as against express v4 which takes "/_"

## 3. Run the application

To run the application we will use a script in our package json with the name "start". So, in your terminal run:

```bash
npm start
```

OR

```bash
npm run start
```

## 3. TO RUN TEST

Simply use the command below to the test the application

```bash
npm test
```

Cheers
