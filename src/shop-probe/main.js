import {createTokenSession} from '../drive/auth.js';
import {APP_CONFIG} from '../trainer/config.js';
import {createProbeTransport} from './transport.js';
import {runProbeScenarios} from './scenarios.js';
const el=id=>document.getElementById(id);
let session=null,connected=false,busy=false,report=null;
const diagnosticMessages={
  'missing-file-version':'Die Antwort enthält keine gültige Dateiversion.',
  'changed-during-read':'Die Dateiversion oder die technische Versionskennung unterscheiden sich zwischen zwei Leseantworten. Eine abgelehnte Schreibanfrage ist damit noch nicht nachgewiesen.',
  'missing-strong-etag':'Eine starke Versionskennung fehlt oder ist für den Browser nicht verwendbar.',
};
function buttons(){el('connect').disabled=busy||connected;el('disconnect').disabled=busy||!connected;el('start').disabled=busy||!connected||!el('consent').checked;el('source').disabled=busy;el('consent').disabled=busy;el('download').disabled=!report||busy;}
el('consent').addEventListener('change',buttons);
el('connect').addEventListener('click',async()=>{
  busy=true;buttons();el('status').textContent='Google-Anmeldung wird geöffnet.';
  try{session??=createTokenSession({oauth2:globalThis.google?.accounts?.oauth2,clientId:APP_CONFIG.googleClientId});await session.connect();connected=true;el('status').textContent='Verbunden. Erst der ausdrückliche Probestart legt synthetische Dateien an.';}
  catch{el('status').textContent='Anmeldung nicht abgeschlossen. Bitte Google-Verbindung und erlaubten App-Ursprung prüfen.';}
  finally{busy=false;buttons();}
});
el('disconnect').addEventListener('click',()=>{session?.invalidate();connected=false;el('status').textContent='Lokale Sitzung beendet. Vorhandene Probe-Dateien bleiben in Drive.';buttons();});
el('start').addEventListener('click',async()=>{
  if(busy||!connected||!el('consent').checked)return;
  busy=true;report=null;buttons();el('checks').replaceChildren();el('status').textContent='Synthetische Dateien werden angelegt und geprüft …';
  const startedAt=new Date().toISOString(),etagSource=el('source').value;
  try{
    const result=await runProbeScenarios({transport:createProbeTransport({token:()=>session.getToken(),etagSource}),emit:check=>{
      const item=document.createElement('li');item.textContent=`${check.passed?'Bestanden':check.status==='unsupported'?'Nicht nachgewiesen':'Fehlgeschlagen'}: ${check.expected} Ergebnis: ${typeof check.actual==='string'?check.actual:JSON.stringify(check.actual)}`;
      if(check.diagnostic){const message=diagnosticMessages[check.diagnostic.reason];if(message)item.append(document.createTextNode(` ${message} Details: ${JSON.stringify(check.diagnostic)}`));}
      if(check.evidence)item.append(document.createTextNode(` Prüfstelle und Antwortklassen: ${JSON.stringify(check.evidence)}`));
      el('checks').append(item);
    }});
    const apiPaths=etagSource==='v2-coherent'
      ?{idReservation:'GET /drive/v3/files/generateIds',create:'POST /drive/v3/files oder /upload/drive/v3/files',metadataRead:'GET /drive/v2/files/{ownedId}?fields=...version,etag,md5Checksum,headRevisionId,modifiedDate,lastViewedByMeDate,fileSize',read:'GET /drive/v2/files/{probeFileId}?alt=media',mediaUpdate:'PUT /upload/drive/v2/files/{probeFileId}?uploadType=media',metadataUpdate:'PUT /drive/v2/files/{probeFolderId}',condition:'If-Match'}
      :{idReservation:'GET /drive/v3/files/generateIds',create:'POST /drive/v3/files oder /upload/drive/v3/files',read:'GET /drive/v3/files/{probeFileId}?alt=media',metadataRead:'GET /drive/v3/files/{ownedId}?fields=id,name,mimeType,parents,appProperties,trashed,version',
        ...(etagSource==='v2-json'?{tokenRead:'GET /drive/v2/files/{ownedId}?fields=id,mimeType,etag'}:{}),mediaUpdate:'PATCH /upload/drive/v3/files/{probeFileId}?uploadType=media',metadataUpdate:'PATCH /drive/v3/files/{probeFolderId}',condition:'If-Match'};
    report={kind:'synthetic-shop-probe',diagnosticVersion:6,startedAt,completedAt:new Date().toISOString(),origin:location.origin,userAgent:navigator.userAgent,etagSource,apiPaths,...result};
    el('status').textContent=result.passed?'Alle isolierten Probeszenarien bestanden. Produktshop bleibt gesperrt; weitere Nachweise stehen aus.':'Kaufkoordination nicht ausreichend nachgewiesen. Produktshop bleibt gesperrt.';
  }catch{el('status').textContent='Probe unterbrochen. Kein vollständiger Nachweis; Produktshop bleibt gesperrt.';}
  finally{busy=false;el('consent').checked=false;buttons();}
});
el('download').addEventListener('click',()=>{
  if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='shop-probe-bericht6.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
buttons();
