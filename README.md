<div align="center">

# Bandwidth Call Tracking NodeJS Example 

<a href="http://dev.bandwidth.com"><img src="https://s3.amazonaws.com/bwdemos/BW-VMP.png"/></a>
</div>

Bandwidth voice API Sample App for Call Tracking. See [docs](http://ap.bandwidth.com/).

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### The flow of the app ###

The app provides an API to create/edit Call Tracking Numbers and handle callback events from Catapult.

See [callback events docs](http://ap.bandwidth.com/docs/xml/bxml-callback-events/) for more information.

There are two main entities in the app - `Number` and `CDR`.

`Number` is represented as a mongo document with `trackingNumber`, `businessNumber` and some configuration fields.

`trackingNumber` is a number you order from catapult which will receive calls. It is created automatically each time you create the `Number`. See [application docs](http://ap.bandwidth.com/docs/rest-api/applications/) and [number docs](http://ap.bandwidth.com/docs/rest-api/phonenumbers/) for more information.

`businessNumber` is your real number. It is a number to which call will be redirected when someone calls your `trackingNumber`.

Use the following request to create the `Number`:

Request example:

`POST /api/v1.0/number/create`

```
{
  "businessNumber": "+19999999999"
}
```

Response example:

```
{
  "businessNumber": "+19999999999",
  "trackingNumber": "+19998888888",
  "whisperPrompt": "true",
  "recordCall": "true",
  "playDisclaimer": "true",
  "status": "activated",
  ...
}
```

Use following request to edit the `Number`:

Request example

`PATCH /api/v1.0/number/edit/<document id>`

```
{
  "businessNumber": "+19999999999"
}
```

Since you have `trackingNumber` you can check the application. When you make a call to your `trackingNumber`, Catapult determines which url to send event callback to, according to settings of your catapult application. When request comes from Catapult, the app determines `businessNumber` by `trackingNumber` and redirects the call. Each time Catapult event request comes to the app, the `CDR` record is updated, so we can see full call event history and call data.
No methods are provided to view `CDR`s, but they can be easily implemented.

If you don't need some settings (such as `recordCall`, `playDisclaimer`, `whisperPrompt`), you can simply skip them.

If you don't want to get calls to your `businessNumber` just set `status` to `"expired"`.

There is no functionality to release number from Catapult, but it can be easily implemented using [node-bandwidth](https://github.com/bandwidthcom/node-bandwidth) package.

For more information see source code and comments.

### Prerequisites ###

* Bandwidth account
* Catapult Application
* NodeJS 4.0
* MongoDB 3.0

### Deploy to Heroku ###

Press the button below and follow instructions to deploy the app in Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

After deployment you should update your Catapult application with callback url to receive call events to your heroku application.

### Run on local machine ###

* Add environment variables which are your catapult credentials.

Required:

`API_TOKEN` - catapult account token

`API_SECRET` - catapult account secret

`USER_ID` - catapult account user id

`APPLICATION_ID` - catapult application id

Optional:

`PORT` - port to run server locally. Default port 3000 will be used if `PORT` is not provided.

For example you can set them globally for your local machine user:

Edit (or create) `.bash_profile`

`$EDITOR ~/.bash_profile`

Add variables to the end of the file and save it

```
export API_TOKEN=your_token
export API_SECRET=your_secret
export USER_ID=your_user_id
export APPLICATION_ID=your_application_id
```

* Clone repo

```
git clone https://github.com/BandwidthExamples/node-call-tracking-bxml-express.git
```

* Install dependencies

```
cd node-call-tracking-bxml-express
npm install
```

* Run server
```
node server
```


### Test the app ###

* Install grunt
```
npm install -g grunt-cli
```

For more information see [grunt docs](http://gruntjs.com/getting-started#installing-the-cli)

* Run grunt tasks.
```
grunt
```

Grunt will run not only tests. If you need to run them separately, use mocha:
```
mocha -g 'name of the test or pattern'
```

or

```
mocha
```

to run all of them.

### Receiving call events locally ###

Use [ngrok](https://ngrok.com/) to be able to develop and test the app locally. For more information about installation and usage see [ngrok documentation](https://ngrok.com/docs).
