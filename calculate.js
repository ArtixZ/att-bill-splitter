const { spawnSync } = require("child_process");
const path = require("path");

async function calculate(page, billObj, users) {
    const { period, sharedAmount, individuals } = billObj;

    const userEmailMap = {};

    users.forEach(({ phoneNumer, notifyEmail }) => {
        userEmailMap[phoneNumer.replace(/[^0-9]/g, "")] = notifyEmail;
    });

    // download PDF.

    const pdfConfig = {
        path: "BillScreenShot.pdf", // Saves pdf to disk.
        format: "A4",
        printBackground: true,
        margin: {
            // Word's default A4 margins
            top: "2.54cm",
            bottom: "2.54cm",
            left: "2.54cm",
            right: "2.54cm",
        },
    };
    await page.emulateMediaType("screen");
    await page.pdf(pdfConfig);

    console.log(`Bill for Period ${period}: `);
    for (const phoneNum in individuals) {
        // spawn child process to send email. setup ssmtp in your machine: https://raspberry-projects.com/pi/software_utilities/email/ssmtp-to-send-emails.
        const numOfLines = Object.keys(individuals).length;
        let cost =
            Number(individuals[phoneNum].replace("$", "")) +
            Number(sharedAmount.replace("$", "")) / numOfLines;
        cost = Math.ceil((cost + Number.EPSILON) * 100) / 100;

        console.log(`${phoneNum} -- ${cost}`);
        const email = userEmailMap[phoneNum.replace(/[^0-9]/g, "")];

        if (email) {
            // const command = `echo "Your AT&T monthly cost is $ ${cost}.  Please pay via Venmo. My Venmo account is attached." | mail -s "Test Subject" ${email} -A BillScreenShot.pdf -A myVenmo.jpeg`;

            const strIn = `Hello from Family Plan! \n\nYour AT&T monthly cost is >>>$${cost}<<<. \n\nPlease pay via Venmo. Both my Venmo account and billing PDF are attached. \n\nThanks, Dongyue`;
            try {
                spawnSync(
                    "mail",
                    [
                        "-s",
                        "Test Subject",
                        "-a",
                        "From: Dongyue Zhu <az6991870@gmail.com>",
                        email,
                        "-A",
                        path.join(__dirname, "BillScreenShot.pdf"),
                        "-A",
                        path.join(__dirname, "myVenmo.jpeg"),
                    ],
                    { input: strIn }
                );
            } catch (err) {
                console.log("Error on sending email", err);
                throw err;
            }

            // const mailCMD = spawnSyn("mail", ['-s', 'Test Subject', email, '-A', path.join(__dirname, 'BillScreenShot.pdf'), '-A', path.join(__dirname, 'myVenmo.jpeg')])
            //                 .on('error', function(err) {
            //                     console.log(err);
            //                     throw err;
            //                 });

            // echoCMD.stdout.pipe(mailCMD.stdin);

            // spawn('bash', [`./sendMail.sh ${cost} ${email}`]);
        }
    }
}

module.exports = calculate;
