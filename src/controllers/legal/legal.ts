import * as express from "express";
import {SystemConfiguration} from "../../models/system-vars";
import * as pug from "pug";

const router = express.Router();

router.get("/about", (req: express.Request, res: express.Response) => {
    renderLegalDocument(
        res,
        "About",
        getLegalDocumentContent("about-content") + `

<div class="text-center" style="margin-top: 50px;">
    <a href="${SystemConfiguration.pages.libraries}" target="_blank">Third party libraries</a>
</div>`,
        true
    );
});

router.get("/terms", (req: express.Request, res: express.Response) => {
    renderLegalDocument(
        res,
        "Terms and Conditions of Use of Tellyou Podium Ltd.\n",
        getLegalDocumentContent("terms-content")
    );
});

router.get("/privacy", (req: express.Request, res: express.Response) => {
    renderLegalDocument(
        res,
        "PRIVACY POLICY",
        getLegalDocumentContent("privacy-content")
    );
});

function renderLegalDocument(res: express.Response, title: string, content: string, displayDevelopmentCopyrights: boolean = false) {
    return res.render("legal/legal", {
        brand: process.env.APP_NAME,
        title: title,
        content: content,
        displayDevelopmentCopyrights: displayDevelopmentCopyrights,
        links: SystemConfiguration.pages,
    });
}

function getLegalDocumentContent(file: String) {
    const path = __dirname + "/../../../views/legal/" + file + ".pug";
    return pug.renderFile(path, {
        links: SystemConfiguration.pages,
    });
}

export default router;