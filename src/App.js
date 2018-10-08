import React, { Component } from "react";
import Dropzone from "react-dropzone";
import OpenTimestamps from "javascript-opentimestamps";

import logo from "./ots.svg";
import "./App.css";

const LINE_LEN = 160;

class App extends Component {
  state = {
    result: []
  };

  setRes(line) {
    let { result } = this.state;
    let row = `>$${line}`;
    if (row.length > LINE_LEN) {
      const cArr = row.split("");
      row = cArr.reduce(
        (str, c, i) => (i % LINE_LEN === 0 ? `${str}${c}\n   ` : `${str}${c}`),
        ""
      );
    }
    if (result) {
      result.push(row);
      this.setState({ result });
    } else {
      this.setState(row);
    }
  }

  sign(binary) {
    const file = Buffer.from(binary);
    const detachedTimestamp = OpenTimestamps.DetachedTimestampFile.fromBytes(
      new OpenTimestamps.Ops.OpSHA256(),
      file
    );
    OpenTimestamps.stamp(detachedTimestamp)
      .then(() => {
        const serializedTimestamp = detachedTimestamp.serializeToBytes();
        const detachedOts = OpenTimestamps.DetachedTimestampFile.deserialize(
          serializedTimestamp
        );
        // note that `detachedTimestamp` is equals to `detachedOts`
        this.setRes(`detachedTimestamp: ${JSON.stringify(detachedTimestamp)}`);
        this.setRes(`detachedOts: ${JSON.stringify(detachedOts)}`);
        let infoResult = OpenTimestamps.info(detachedTimestamp);
        this.setRes(
          `infoResult detachedTimestamp: ${JSON.stringify(infoResult)}`
        );
        infoResult = OpenTimestamps.info(detachedOts);
        this.setRes(`infoResult detachedOts: ${JSON.stringify(infoResult)}`);

        const options = {
          insight: {
            timeout: 30,
            chain: "bitcoin",
            urls: [
              "https://www.localbitcoinschain.com/api",
              "https://blockexplorer.com/api",
              "https://search.bitaccess.co/insight-api",
              "https://insight.bitpay.com/api"
            ]
          }
        };

        OpenTimestamps.verify(detachedOts, detachedTimestamp, options)
          .then(verifyResult => {
            console.log("verifyResult", verifyResult);
            this.setRes(
              `verifyResult: ${JSON.stringify(
                verifyResult
              )} //verify output is empty because no verified attestations found, wait to be upgraded`
            );
          })
          .catch(err => {
            console.error(err);
            this.setRes(`err: ${JSON.stringify(err)}`);
          });
      })
      .catch(err => {
        console.error(err);
        this.setRes(`err: ${JSON.stringify(err)}`);
      });
  }

  handleDrop(files) {
    files.forEach(el => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileAsBinaryString = reader.result;
        this.sign(fileAsBinaryString);
      };

      reader.onabort = () => this.setRes("err: file reading was aborted");
      reader.onerror = () => this.setRes("err: file reading has failed");

      reader.readAsBinaryString(el);
    });
  }

  render() {
    const { result } = this.state;
    return (
      <div
        className="Sample"
        style={{
          primaryFontColor: "#fff",
          fontFamily: "Consolas,monaco,monospace"
        }}
      >
        <header className="App-header">
          <div>
            Simple <code>opentimestamps</code> test.
          </div>
          <img src={logo} className="App-logo" alt="logo" />
          <br />
          <Dropzone onDrop={this.handleDrop.bind(this)}>
            {"Sign the files here"}
          </Dropzone>
          <div
            style={{
              fontSize: 14,
              textAlign: "left",
              whiteSpace: "pre",
              flex: true,
              width: "90%",
              marginRight: "30px"
            }}
          >
            {result.join("\n\n")}
          </div>
        </header>
      </div>
    );
  }
}

export default App;
