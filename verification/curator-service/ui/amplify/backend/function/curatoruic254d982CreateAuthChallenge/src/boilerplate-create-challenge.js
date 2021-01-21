const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});
// const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {

    let secretLoginCode;
    if (!event.request.session || !event.request.session.length) {

        // This is a new auth session
        // Generate a new secret login code and mail it to the user
        secretLoginCode = '1234';   
        // const testAccount = await nodemailer.createTestAccount();

        // const transporter = nodemailer.createTransport({
        //     host: "smtp.ethereal.email",
        //     port: 587,
        //     secure: false, // true for 465, false for other ports
        //     auth: {
        //         user: testAccount.user, // generated ethereal user
        //         pass: testAccount.pass, // generated ethereal password
        //     },
        // });

        // // send mail with defined transport object
        // await transporter.sendMail({
        //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
        //     to: "maciek3609@gmail.com", // list of receivers
        //     subject: "Verification code", // Subject line
        //     text: "Your verification code is: 1234", // plain text body
        //     html: "<b>Hello world?</b>", // html body
        // });
        // const params = {
        // Destination: { ToAddresses: [event.request.userAttributes.email] },
        // Message: {
        //     Body: {
        //         Html: {
        //             Charset: 'UTF-8',
        //             Data: `<html><body><p>This is your secret login code:</p>
        //                    <h3>${secretLoginCode}</h3></body></html>`
        //         },
        //         Text: {
        //             Charset: 'UTF-8',
        //             Data: `Your secret login code: ${secretLoginCode}`
        //         }
        //     },
        //     Subject: {
        //         Charset: 'UTF-8',
        //         Data: 'Your secret login code'
        //     }
        // },
        // Source: 'maciek3609@gmail.com'
        // };
    // await ses.sendEmail(params).promise();
    } else {

        // There's an existing session. Don't generate new digits but
        // re-use the code from the current session. This allows the user to
        // make a mistake when keying in the code and to then retry, rather
        // the needing to e-mail the user an all new code again.    
        const previousChallenge = event.request.session.slice(-1)[0];
        secretLoginCode = previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1];
    }

    // This is sent back to the client app
    event.response.publicChallengeParameters = {
        email: event.request.userAttributes.email
    };

    // Add the secret login code to the private challenge parameters
    // so it can be verified by the "Verify Auth Challenge Response" trigger
    event.response.privateChallengeParameters = { secretLoginCode };

    // Add the secret login code to the session so it is available
    // in a next invocation of the "Create Auth Challenge" trigger
    event.response.challengeMetadata = `CODE-${secretLoginCode}`;

    context.done(null, event);
};