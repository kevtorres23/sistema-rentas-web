import React, { useState } from "react";
import SignatureCanvas from "react-signature-canvas";

function LienzoFirma() {
    return (
        <div className="container" style={{borderWidth: 1, borderColor: "grey", borderRadius: 10, borderStyle: "solid"}}>
            <SignatureCanvas />
        </div>
    );
};

export default LienzoFirma;