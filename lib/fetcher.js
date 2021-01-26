const fetch = require('node-fetch')
const fs = require('fs')
const util = require('util')
const path = require('path')
const FileType = require('file-type')
const { spawn } = require('child_process')
const { MessageType } = require('@adiwajshing/baileys')


exports.getBase64 = getBase64 = async (url) => {
    const response = await fetch(url, { headers: { 'User-Agent': 'okhttp/4.5.0' } });
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    const buffer = await response.buffer();
    const videoBase64 = `data:${response.headers.get('content-type')};base64,` + buffer.toString('base64');
    if (buffer)
        return videoBase64;
};

exports.getBuffer = getBuffer = async (url) => {
	const res = await fetch(url, {headers: { 'User-Agent': 'okhttp/4.5.0'}, method: 'GET' })
	const anu = fs.readFileSync('./src/emror.jpg')
	if (!res.ok) return { type: 'image/jpeg', result: anu }
	const buff = await res.buffer()
	if (buff)
		return { type: res.headers.get('content-type'), result: buff }
}

exports.fetchJson = fetchJson = (url, options) => new Promise(async (resolve, reject) => {
    fetch(url, options)
        .then(response => response.json())
        .then(json => {
            // console.log(json)
            resolve(json)
        })
        .catch((err) => {
            reject(err)
        })
})


exports.fetchText = fetchText = (url, options) => new Promise(async (resolve, reject) => {
    fetch(url, options)
        .then(response => response.text())
        .then(text => {
            // console.log(text)
            resolve(text)
        })
        .catch((err) => {
            reject(err)
        })
})

exports.WAConnection = (_WAConnection) => {
	class WAConnection extends _WAConnection {
		constructor(...args) {
		  super(...args)
	  }

    async waitEvent(eventName) {
      return await (new Promise(resolve => this.once(eventName, resolve)))
    }

  	async sendFile(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
	  	let file = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  		const type = await FileType.fromBuffer(file) || {
        mime: 'application/octet-stream',
        ext: '.bin'
      }
      if (!type) {
        options.asDocument = true
      }
  		let mtype = ''
  		let opt = { filename, caption }
      if (!options.asDocument) {
        if (/audio/.test(type.mime)) file = await (ptt ? toPTT : toAudio)(file, type.ext)
   		  else if (/video/.test(type.mime)) file = await toVideo(file, type.ext)
    		if (/image/.test(type.mime)) mtype = MessageType.image
    		else if (/video/.test(type.mime)) mtype = MessageType.video
     		else opt.caption = filename
     		if (/audio/.test(type.mime)) {
    			mtype = MessageType.audio
    			opt.ptt = ptt
    		} else if (/pdf/.test(type.ext)) mtype = MessageType.pdf
    		else if (!mtype) {
          mtype = MessageType.document
          opt.mimetype = type.mime
        }
        delete options.asDocument
      } else {
        mtype = MessageType.document
        opt.mimetype = type.mime
      }
      if (quoted) opt.quoted = quoted
  		return await this.sendMessage(jid, file, mtype, {...opt, ...options})
  	}

  	reply(jid, text, quoted, options) {
  		return this.sendMessage(jid, text, MessageType.extendedText, { quoted, ...options })
  	}
	
	  fakeReply(jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid) {
  		return this.reply(jid, text, { key: { fromMe: fakeJid == this.user.jid, participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }})
  	}

  	parseMention(text) {
  		return [...text.matchAll(/@(\d{5,16})/g)].map(v => v[1] + '@s.whatsapp.net')
  	}

	  getName(jid)  {
  		let v = jid === this.user.jid ? this.user : this.contacts[jid] || { notify: jid.replace(/@.+/, '') }
  		return v.name || v.vname || v.notify
  	}

	  async downloadM(mek) {
      if (!mek) return Buffer.alloc(0)
    	if (!mek.message) return Buffer.alloc(0)
	  	if (!mek.message[Object.keys(mek.message)[0]].url) await this.updateMediaMessage(mek)
  		return await this.downloadMediaMessage(m)
  	}
	}

  return WAConnection
}

//exports.getBase64 = getBase64;
