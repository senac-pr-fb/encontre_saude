import{R,a as J,A as te}from"./authService-FkTjPsGX.js";import{c as ne}from"./sidebar-BkaUTNX8.js";import{c as oe}from"./footer-B06_h6Rx.js";import{c as se}from"./chatService-C8Ne2wPU.js";function ie(){const e=document.querySelector("main");if(!e)return;const t=document.createElement("div");t.className="textCenter";const n=document.createElement("h1");n.textContent="Sua saúde em primeiro lugar",t.appendChild(n);const o=document.createElement("div");o.className="cards",[{title:"Farmácias",icon:"fa-solid fa-prescription-bottle-medical iconSaude",text:"Veja Onde se Cuidar: Farmácias e Informações de Saúde",route:R.farmacia},{title:"Primeiros Socorros",icon:"fa-solid fa-briefcase-medical iconSaude",text:"O que fazer enquanto o resgate não chega",route:R.primeirosSocorros},{title:"Ações Preventivas",icon:"fa-solid fa-shield-heart iconSaude",text:"Dicas e informações para manter-se sempre bem",route:R.prevensao}].forEach(({title:i,icon:a,text:l,route:f})=>{const g=document.createElement("div");g.className="card";const p=document.createElement("h2");p.textContent=i;const d=document.createElement("i");d.className=a;const c=document.createElement("p");c.textContent=l;const r=document.createElement("button");r.className="button",r.textContent="Ver Mais",r.addEventListener("click",()=>{window.location.href=f}),g.appendChild(p),g.appendChild(d),g.appendChild(c),g.appendChild(r),o.appendChild(g)}),e.appendChild(t),e.appendChild(o)}var w;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(w||(w={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var M;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(M||(M={}));var x;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(x||(x={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const L=["user","model","function","system"];var D;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(D||(D={}));var U;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(U||(U={}));var F;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(F||(F={}));var H;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(H||(H={}));var I;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(I||(I={}));var G;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(G||(G={}));var k;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(k||(k={}));var $;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})($||($={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m extends Error{constructor(t){super(`[GoogleGenerativeAI Error]: ${t}`)}}class _ extends m{constructor(t,n){super(t),this.response=n}}class z extends m{constructor(t,n,o,s){super(t),this.status=n,this.statusText=o,this.errorDetails=s}}class E extends m{}class X extends m{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ae="https://generativelanguage.googleapis.com",re="v1beta",ce="0.24.1",de="genai-js";var C;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(C||(C={}));class le{constructor(t,n,o,s,i){this.model=t,this.task=n,this.apiKey=o,this.stream=s,this.requestOptions=i}toString(){var t,n;const o=((t=this.requestOptions)===null||t===void 0?void 0:t.apiVersion)||re;let i=`${((n=this.requestOptions)===null||n===void 0?void 0:n.baseUrl)||ae}/${o}/${this.model}:${this.task}`;return this.stream&&(i+="?alt=sse"),i}}function ue(e){const t=[];return e!=null&&e.apiClient&&t.push(e.apiClient),t.push(`${de}/${ce}`),t.join(" ")}async function fe(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",ue(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let o=(t=e.requestOptions)===null||t===void 0?void 0:t.customHeaders;if(o){if(!(o instanceof Headers))try{o=new Headers(o)}catch(s){throw new E(`unable to convert customHeaders value ${JSON.stringify(o)} to Headers: ${s.message}`)}for(const[s,i]of o.entries()){if(s==="x-goog-api-key")throw new E(`Cannot set reserved header name ${s}`);if(s==="x-goog-api-client")throw new E(`Header name ${s} can only be set using the apiClient field`);n.append(s,i)}}return n}async function ge(e,t,n,o,s,i){const a=new le(e,t,n,o,i);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},ve(i)),{method:"POST",headers:await fe(a),body:s})}}async function O(e,t,n,o,s,i={},a=fetch){const{url:l,fetchOptions:f}=await ge(e,t,n,o,s,i);return he(l,f,a)}async function he(e,t,n=fetch){let o;try{o=await n(e,t)}catch(s){me(s,e)}return o.ok||await pe(o,e),o}function me(e,t){let n=e;throw n.name==="AbortError"?(n=new X(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof z||e instanceof E||(n=new m(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function pe(e,t){let n="",o;try{const s=await e.json();n=s.error.message,s.error.details&&(n+=` ${JSON.stringify(s.error.details)}`,o=s.error.details)}catch{}throw new z(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`,e.status,e.statusText,o)}function ve(e){const t={};if((e==null?void 0:e.signal)!==void 0||(e==null?void 0:e.timeout)>=0){const n=new AbortController;(e==null?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),e!=null&&e.signal&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function T(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),S(e.candidates[0]))throw new _(`${v(e)}`,e);return Ee(e)}else if(e.promptFeedback)throw new _(`Text not available. ${v(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),S(e.candidates[0]))throw new _(`${v(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),B(e)[0]}else if(e.promptFeedback)throw new _(`Function call not available. ${v(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),S(e.candidates[0]))throw new _(`${v(e)}`,e);return B(e)}else if(e.promptFeedback)throw new _(`Function call not available. ${v(e)}`,e)},e}function Ee(e){var t,n,o,s;const i=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const a of(s=(o=e.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)a.text&&i.push(a.text),a.executableCode&&i.push("\n```"+a.executableCode.language+`
`+a.executableCode.code+"\n```\n"),a.codeExecutionResult&&i.push("\n```\n"+a.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}function B(e){var t,n,o,s;const i=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const a of(s=(o=e.candidates)===null||o===void 0?void 0:o[0].content)===null||s===void 0?void 0:s.parts)a.functionCall&&i.push(a.functionCall);if(i.length>0)return i}const Ce=[I.RECITATION,I.SAFETY,I.LANGUAGE];function S(e){return!!e.finishReason&&Ce.includes(e.finishReason)}function v(e){var t,n,o;let s="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)s+="Response was blocked",!((t=e.promptFeedback)===null||t===void 0)&&t.blockReason&&(s+=` due to ${e.promptFeedback.blockReason}`),!((n=e.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(s+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((o=e.candidates)===null||o===void 0)&&o[0]){const i=e.candidates[0];S(i)&&(s+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(s+=`: ${i.finishMessage}`))}return s}function y(e){return this instanceof y?(this.v=e,this):new y(e)}function _e(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o=n.apply(e,t||[]),s,i=[];return s={},a("next"),a("throw"),a("return"),s[Symbol.asyncIterator]=function(){return this},s;function a(c){o[c]&&(s[c]=function(r){return new Promise(function(u,h){i.push([c,r,u,h])>1||l(c,r)})})}function l(c,r){try{f(o[c](r))}catch(u){d(i[0][3],u)}}function f(c){c.value instanceof y?Promise.resolve(c.value.v).then(g,p):d(i[0][2],c)}function g(c){l("next",c)}function p(c){l("throw",c)}function d(c,r){c(r),i.shift(),i.length&&l(i[0][0],i[0][1])}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const j=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function Ie(e){const t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=Oe(t),[o,s]=n.tee();return{stream:be(o),response:ye(s)}}async function ye(e){const t=[],n=e.getReader();for(;;){const{done:o,value:s}=await n.read();if(o)return T(Se(t));t.push(s)}}function be(e){return _e(this,arguments,function*(){const n=e.getReader();for(;;){const{value:o,done:s}=yield y(n.read());if(s)break;yield yield y(T(o))}})}function Oe(e){const t=e.getReader();return new ReadableStream({start(o){let s="";return i();function i(){return t.read().then(({value:a,done:l})=>{if(l){if(s.trim()){o.error(new m("Failed to parse stream"));return}o.close();return}s+=a;let f=s.match(j),g;for(;f;){try{g=JSON.parse(f[1])}catch{o.error(new m(`Error parsing JSON response: "${f[1]}"`));return}o.enqueue(g),s=s.substring(f[0].length),f=s.match(j)}return i()}).catch(a=>{let l=a;throw l.stack=a.stack,l.name==="AbortError"?l=new X("Request aborted when reading from the stream"):l=new m("Error reading from the stream"),l})}}})}function Se(e){const t=e[e.length-1],n={promptFeedback:t==null?void 0:t.promptFeedback};for(const o of e){if(o.candidates){let s=0;for(const i of o.candidates)if(n.candidates||(n.candidates=[]),n.candidates[s]||(n.candidates[s]={index:s}),n.candidates[s].citationMetadata=i.citationMetadata,n.candidates[s].groundingMetadata=i.groundingMetadata,n.candidates[s].finishReason=i.finishReason,n.candidates[s].finishMessage=i.finishMessage,n.candidates[s].safetyRatings=i.safetyRatings,i.content&&i.content.parts){n.candidates[s].content||(n.candidates[s].content={role:i.content.role||"user",parts:[]});const a={};for(const l of i.content.parts)l.text&&(a.text=l.text),l.functionCall&&(a.functionCall=l.functionCall),l.executableCode&&(a.executableCode=l.executableCode),l.codeExecutionResult&&(a.codeExecutionResult=l.codeExecutionResult),Object.keys(a).length===0&&(a.text=""),n.candidates[s].content.parts.push(a)}s++}o.usageMetadata&&(n.usageMetadata=o.usageMetadata)}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function W(e,t,n,o){const s=await O(t,C.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),o);return Ie(s)}async function Q(e,t,n,o){const i=await(await O(t,C.GENERATE_CONTENT,e,!1,JSON.stringify(n),o)).json();return{response:T(i)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Z(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function b(e){let t=[];if(typeof e=="string")t=[{text:e}];else for(const n of e)typeof n=="string"?t.push({text:n}):t.push(n);return Ae(t)}function Ae(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of e)"functionResponse"in i?(n.parts.push(i),s=!0):(t.parts.push(i),o=!0);if(o&&s)throw new m("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!o&&!s)throw new m("No content is provided for sending chat message.");return o?t:n}function Re(e,t){var n;let o={model:t==null?void 0:t.model,generationConfig:t==null?void 0:t.generationConfig,safetySettings:t==null?void 0:t.safetySettings,tools:t==null?void 0:t.tools,toolConfig:t==null?void 0:t.toolConfig,systemInstruction:t==null?void 0:t.systemInstruction,cachedContent:(n=t==null?void 0:t.cachedContent)===null||n===void 0?void 0:n.name,contents:[]};const s=e.generateContentRequest!=null;if(e.contents){if(s)throw new E("CountTokensRequest must have one of contents or generateContentRequest, not both.");o.contents=e.contents}else if(s)o=Object.assign(Object.assign({},o),e.generateContentRequest);else{const i=b(e);o.contents=[i]}return{generateContentRequest:o}}function q(e){let t;return e.contents?t=e:t={contents:[b(e)]},e.systemInstruction&&(t.systemInstruction=Z(e.systemInstruction)),t}function Ne(e){return typeof e=="string"||Array.isArray(e)?{content:b(e)}:e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Te={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function we(e){let t=!1;for(const n of e){const{role:o,parts:s}=n;if(!t&&o!=="user")throw new m(`First content should be with role 'user', got ${o}`);if(!L.includes(o))throw new m(`Each item should include role field. Got ${o} but valid roles are: ${JSON.stringify(L)}`);if(!Array.isArray(s))throw new m("Content should have 'parts' property with an array of Parts");if(s.length===0)throw new m("Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const l of s)for(const f of P)f in l&&(i[f]+=1);const a=Te[o];for(const l of P)if(!a.includes(l)&&i[l]>0)throw new m(`Content with role '${o}' can't contain '${l}' part`);t=!0}}function K(e){var t;if(e.candidates===void 0||e.candidates.length===0)return!1;const n=(t=e.candidates[0])===null||t===void 0?void 0:t.content;if(n===void 0||n.parts===void 0||n.parts.length===0)return!1;for(const o of n.parts)if(o===void 0||Object.keys(o).length===0||o.text!==void 0&&o.text==="")return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y="SILENT_ERROR";class Me{constructor(t,n,o,s={}){this.model=n,this.params=o,this._requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=t,o!=null&&o.history&&(we(o.history),this._history=o.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(t,n={}){var o,s,i,a,l,f;await this._sendPromise;const g=b(t),p={safetySettings:(o=this.params)===null||o===void 0?void 0:o.safetySettings,generationConfig:(s=this.params)===null||s===void 0?void 0:s.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(a=this.params)===null||a===void 0?void 0:a.toolConfig,systemInstruction:(l=this.params)===null||l===void 0?void 0:l.systemInstruction,cachedContent:(f=this.params)===null||f===void 0?void 0:f.cachedContent,contents:[...this._history,g]},d=Object.assign(Object.assign({},this._requestOptions),n);let c;return this._sendPromise=this._sendPromise.then(()=>Q(this._apiKey,this.model,p,d)).then(r=>{var u;if(K(r.response)){this._history.push(g);const h=Object.assign({parts:[],role:"model"},(u=r.response.candidates)===null||u===void 0?void 0:u[0].content);this._history.push(h)}else{const h=v(r.response);h&&console.warn(`sendMessage() was unsuccessful. ${h}. Inspect response object for details.`)}c=r}).catch(r=>{throw this._sendPromise=Promise.resolve(),r}),await this._sendPromise,c}async sendMessageStream(t,n={}){var o,s,i,a,l,f;await this._sendPromise;const g=b(t),p={safetySettings:(o=this.params)===null||o===void 0?void 0:o.safetySettings,generationConfig:(s=this.params)===null||s===void 0?void 0:s.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(a=this.params)===null||a===void 0?void 0:a.toolConfig,systemInstruction:(l=this.params)===null||l===void 0?void 0:l.systemInstruction,cachedContent:(f=this.params)===null||f===void 0?void 0:f.cachedContent,contents:[...this._history,g]},d=Object.assign(Object.assign({},this._requestOptions),n),c=W(this._apiKey,this.model,p,d);return this._sendPromise=this._sendPromise.then(()=>c).catch(r=>{throw new Error(Y)}).then(r=>r.response).then(r=>{if(K(r)){this._history.push(g);const u=Object.assign({},r.candidates[0].content);u.role||(u.role="model"),this._history.push(u)}else{const u=v(r);u&&console.warn(`sendMessageStream() was unsuccessful. ${u}. Inspect response object for details.`)}}).catch(r=>{r.message!==Y&&console.error(r)}),c}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xe(e,t,n,o){return(await O(t,C.COUNT_TOKENS,e,!1,JSON.stringify(n),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Le(e,t,n,o){return(await O(t,C.EMBED_CONTENT,e,!1,JSON.stringify(n),o)).json()}async function De(e,t,n,o){const s=n.requests.map(a=>Object.assign(Object.assign({},a),{model:t}));return(await O(t,C.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:s}),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V{constructor(t,n,o={}){this.apiKey=t,this._requestOptions=o,n.model.includes("/")?this.model=n.model:this.model=`models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=Z(n.systemInstruction),this.cachedContent=n.cachedContent}async generateContent(t,n={}){var o;const s=q(t),i=Object.assign(Object.assign({},this._requestOptions),n);return Q(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(o=this.cachedContent)===null||o===void 0?void 0:o.name},s),i)}async generateContentStream(t,n={}){var o;const s=q(t),i=Object.assign(Object.assign({},this._requestOptions),n);return W(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(o=this.cachedContent)===null||o===void 0?void 0:o.name},s),i)}startChat(t){var n;return new Me(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(n=this.cachedContent)===null||n===void 0?void 0:n.name},t),this._requestOptions)}async countTokens(t,n={}){const o=Re(t,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),n);return xe(this.apiKey,this.model,o,s)}async embedContent(t,n={}){const o=Ne(t),s=Object.assign(Object.assign({},this._requestOptions),n);return Le(this.apiKey,this.model,o,s)}async batchEmbedContents(t,n={}){const o=Object.assign(Object.assign({},this._requestOptions),n);return De(this.apiKey,this.model,t,o)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ue{constructor(t){this.apiKey=t}getGenerativeModel(t,n){if(!t.model)throw new m("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new V(this.apiKey,t,n)}getGenerativeModelFromCachedContent(t,n,o){if(!t.name)throw new E("Cached content must contain a `name` field.");if(!t.model)throw new E("Cached content must contain a `model` field.");const s=["model","systemInstruction"];for(const a of s)if(n!=null&&n[a]&&t[a]&&(n==null?void 0:n[a])!==t[a]){if(a==="model"){const l=n.model.startsWith("models/")?n.model.replace("models/",""):n.model,f=t.model.startsWith("models/")?t.model.replace("models/",""):t.model;if(l===f)continue}throw new E(`Different value for "${a}" specified in modelParams (${n[a]}) and cachedContent (${t[a]})`)}const i=Object.assign(Object.assign({},n),{model:t.model,tools:t.tools,toolConfig:t.toolConfig,systemInstruction:t.systemInstruction,cachedContent:t});return new V(this.apiKey,i,o)}}const N="chatHistorico";async function Fe(e){const{session:t}=await J.getUserSession();if(!t||!e||e.length===0)return;const n=JSON.parse(localStorage.getItem(N)||"[]"),o={id:Date.now(),data:new Date().toLocaleString("pt-BR"),mensagens:e};n.unshift(o),n.length>20&&n.pop(),localStorage.setItem(N,JSON.stringify(n))}function He(){return JSON.parse(localStorage.getItem(N)||"[]")}function Ge(){const e=new Ue(te),t={1:{cor:"#5EA7FF",texto:"Não Urgente"},2:{cor:"#ABFB4F",texto:"Pouco Urgente"},3:{cor:"#FFEA00",texto:"Urgente"},4:{cor:"#FF771C",texto:"Muito Urgente"},5:{cor:"#D51717",texto:"Emergência"}},n=`
Você é um assistente de IA especializado em triagem de sintomas de saúde. Sua tarefa é analisar o relato do usuário e fornecer uma orientação estruturada.

**Instruções de Resposta:**
Você DEVE retornar sua resposta APENAS no formato JSON, sem crase ou markdown (ex: \`\`\`json). O JSON deve conter os seguintes campos:

{
  "nivel": (número de 1 a 5),
  "resumo": "...",
  "recomendacao": "...",
  "primeiros_socorros": "...",
  "unidade_recomendada": "...",
  "sintomas": {
    "febre": boolean,
    "dor_de_cabeca": boolean,
    "tosse": boolean,
    "falta_de_ar": boolean,
    "dor_no_peito": boolean,
    "nausea_vomito": boolean,
    "diarreia": boolean,
    "dor_abdominal": boolean,
    "dor_nas_costas": boolean,
    "tontura": boolean,
    "fraqueza": boolean,
    "coriza": boolean
  }
}

**Escala de Classificação:**
1 - Não Urgente (Autocuidado)
2 - Pouco Urgente (Observação/Farmácia)
3 - Urgente (UBS/Posto de Saúde)
4 - Muito Urgente (UPA)
5 - Emergência (Hospital/SAMU 192)

**Texto do Usuário:**
[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]
`;let o=[];async function s(d){try{const c=e.getGenerativeModel({model:"gemini-2.5-flash"}),r=n.replace("[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]",d),ee=(await(await c.generateContent(r)).response).text().trim().replace(/```json|```/g,"").trim();return JSON.parse(ee)}catch(c){return console.error("Erro ao chamar a API Gemini:",c),null}}function i(d,c){const r=document.getElementById("chat-messages");if(!r)return;const u=document.createElement("div");u.className=`message ${c}`,typeof d=="string"?u.innerHTML=`<p>${d}</p>`:u.appendChild(d),r.appendChild(u),r.scrollTop=r.scrollHeight}function a(){const d=document.getElementById("chat-messages");if(!d)return null;const c=document.createElement("div");return c.className="typing-indicator",c.id="typing-indicator",c.innerHTML='<i class="fa-solid fa-ellipsis fa-bounce"></i> Analisando sintomas...',d.appendChild(c),d.scrollTop=d.scrollHeight,c}function l(){const d=document.getElementById("typing-indicator");d&&d.remove()}function f(d){const c=document.createElement("div");if(!d||!d.nivel)return c.innerHTML='<p style="color:red">Não consegui analisar seus sintomas. Tente descrever com mais detalhes.</p>',c;const r=d.nivel,u=t[r]?t[r].cor:"#ccc",h=t[r]?t[r].texto:"Avaliado";return c.innerHTML=`
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom:0.5rem; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                <div style="width:12px; height:12px; border-radius:50%; background:${u}; box-shadow: 0 0 5px ${u};"></div>
                <strong style="font-size:1.1rem;">${h} (Nível ${r})</strong>
            </div>
            <p>${d.resumo}</p>
            
            <div style="background:rgba(255,255,255,0.1); padding:0.8rem; border-radius:8px; margin-top:0.8rem;">
                <strong>🩺 Recomendação:</strong>
                <p style="margin-top:0.2rem; font-size:0.95rem;">${d.recomendacao}</p>
            </div>

            ${d.primeiros_socorros?`
            <div style="margin-top:0.8rem;">
                <strong>🩹 Dica:</strong>
                <p style="margin-top:0.2rem; font-size:0.95rem;">${d.primeiros_socorros}</p>
            </div>`:""}

            ${d.unidade_recomendada?`
            <div style="margin-top:1rem; font-weight:bold; color:#fff; background:${u}; color:#000; padding:0.5rem 1rem; border-radius:50px; display:inline-block; font-size:0.9rem;">
                🏥 Ir para: ${d.unidade_recomendada}
            </div>`:""}
        `,c}async function g(){const d=document.getElementById("user-input"),c=document.getElementById("send-btn"),r=d.value.trim();if(!r)return;d.value="",d.disabled=!0,c.disabled=!0,i(r,"user"),o.push({tipo:"user",texto:r}),a();const u=await s(r);if(l(),d.disabled=!1,c.disabled=!1,d.focus(),u){const h=f(u);i(h,"ai");const A=`[Nível ${u.nivel}] ${u.resumo}`;o.push({tipo:"ai",texto:A}),await se.saveInteraction(r,A,u.sintomas)}if(Fe(o),u){const h={textoUsuario:r,resultadoIA:u,timestamp:Date.now()};localStorage.setItem("ultimaTriagemIA",JSON.stringify(h))}}function p(){const d=document.getElementById("send-btn"),c=document.getElementById("user-input");d&&d.addEventListener("click",g),c&&c.addEventListener("keydown",r=>{r.key==="Enter"&&g()})}p()}function ke(){const e=document.getElementById("feedbacks");if(!e)return;e.innerHTML="",e.classList.add("feedbacks"),[{title:"Não Urgente",text:"Caso para atendimento na unidade de saúde mais próxima da residência.",color:"#5EA7FF"},{title:"Pouco Urgente",text:"Caso para atendimento preferencial nas unidades de atenção básica.",color:"#ABFB4F"},{title:"Urgente",text:"Caso de gravidade moderada, necessidade de atendimento médico, sem risco imediato.",color:"#FFEA00"},{title:"Muito Urgente",text:"Caso grave e risco significativo de evoluir para morte. Atendimento urgente.",color:"#FF771C"},{title:"Emergência",text:"Caso gravíssimo, com necessidade de atendimento imediato e risco de morte.",color:"#D51717"}].forEach(({title:n,text:o,color:s})=>{const i=document.createElement("div");i.classList.add("feedback");const a=document.createElement("div");a.classList.add("bola"),a.style.backgroundColor=s,i.appendChild(a),e.appendChild(i),i.addEventListener("click",()=>{$e({title:n,text:o,color:s})})})}function $e(e){let t=document.getElementById("feedbackModal");t||(t=document.createElement("div"),t.id="feedbackModal",t.className="modal",t.innerHTML=`
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="modal-header">
          <div class="modal-bola"></div>
          <h2 class="modal-title"></h2>
        </div>
        <p class="modal-text"></p>
      </div>
    `,document.body.appendChild(t),t.querySelector(".close").addEventListener("click",()=>{t.style.display="none"}),t.addEventListener("click",i=>{i.target===t&&(t.style.display="none")}));const n=t.querySelector(".modal-bola"),o=t.querySelector(".modal-title"),s=t.querySelector(".modal-text");n.style.backgroundColor=e.color,o.textContent=e.title,s.textContent=e.text,t.style.display="flex"}async function Be(){const{session:e}=await J.getUserSession(),t=!!e,n=document.getElementById("header"),o=document.querySelector("main");if(!n||!o)return;const s=document.createElement("section");if(s.id="sintomas",s.style.position="relative",s.innerHTML=`
        <div class="sintomas-title-row">
            <h2>Triagem de Sintomas com IA</h2>
            ${t?`
            <button id="btn-historico-chat" class="btn-historico" title="Ver histórico de conversas">
                <i class="fas fa-clock-rotate-left"></i>
                <span>Histórico</span>
            </button>`:""}
        </div>

        <div class="sintomas-container">
            <!-- Left Panel (Legend) -->
            <div class="sintomas-left">
                <div class="aviso-box">
                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Aviso Importante</h3>
                    <p>
                        Esta ferramenta utiliza inteligência artificial para triagem preliminar e <strong>não substitui uma consulta médica</strong>.
                        Em casos de emergência, ligue para 192 ou procure o hospital mais próximo.
                    </p>
                </div>

                <div class="legend-container">
                    <span class="legend-title" style="font-weight:bold; display:block; margin-bottom:1rem;">Níveis de Urgência</span>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#5EA7FF"></div>
                            <div class="legend-text">
                                <strong>Não Urgente</strong>
                                <span>Sintomas leves, sem risco imediato.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#ABFB4F"></div>
                            <div class="legend-text">
                                <strong>Pouco Urgente</strong>
                                <span>Desconforto moderado, observe a evolução.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#FFEA00"></div>
                            <div class="legend-text">
                                <strong>Urgente</strong>
                                <span>Sintomas significativos, busque ajuda se persistir.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#FF771C"></div>
                            <div class="legend-text">
                                <strong>Muito Urgente</strong>
                                <span>Sintomas intensos, requer atenção rápida.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#D51717"></div>
                            <div class="legend-text">
                                <strong>Emergência</strong>
                                <span>Risco à vida, procure atendimento imediato (192).</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel (Chat Interface) -->
            <div class="sintomas-right">
                <div id="chat-container">
                    <div id="chat-messages">
                        <!-- Initial AI Message -->
                        <div class="message ai">
                            <p>Olá! Sou seu assistente de saúde virtual. Por favor, descreva o que você está sentindo com o máximo de detalhes (onde dói, há quanto tempo, intensidade).</p>
                        </div>
                    </div>
                    
                    <div id="input-area">
                        <input type="text" id="user-input" placeholder="Digite seus sintomas aqui..." autocomplete="off">
                        <button id="send-btn">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="feedbacks"></div>

        <!-- Painel de Histórico (só renderizado se logado) -->
        ${t?`
        <div id="painel-historico" class="painel-historico painel-historico--fechado">
            <div class="painel-historico__header">
                <h3><i class="fas fa-clock-rotate-left"></i> Histórico de Conversas</h3>
                <button id="btn-fechar-historico" class="btn-fechar-historico" title="Fechar histórico">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="historico-lista" class="historico-lista">
                <!-- Preenchido via JS -->
            </div>
        </div>`:""}
    `,n.insertAdjacentElement("afterend",s),Ge(),ke(),t){const i=document.getElementById("btn-historico-chat"),a=document.getElementById("painel-historico"),l=document.getElementById("btn-fechar-historico"),f=document.getElementById("historico-lista");async function g(){const p=await He();if(f.innerHTML="",p.length===0){f.innerHTML=`
                    <div class="historico-vazio">
                        <i class="fas fa-comment-medical"></i>
                        <p>Nenhuma conversa salva ainda.</p>
                        <small>Suas consultas com a IA aparecerão aqui.</small>
                    </div>
                `;return}p.forEach(d=>{const c=document.createElement("div");c.className="historico-item";const r=d.mensagens.find(h=>h.tipo==="user"),u=d.mensagens.find(h=>h.tipo==="ai");c.innerHTML=`
                    <div class="historico-item__data">
                        <i class="fas fa-calendar-alt"></i> ${d.data}
                    </div>
                    ${r?`
                    <div class="historico-item__user">
                        <span class="historico-badge historico-badge--user">Você</span>
                        <p>${r.texto}</p>
                    </div>`:""}
                    ${u?`
                    <div class="historico-item__ai">
                        <span class="historico-badge historico-badge--ai">IA</span>
                        <p>${u.texto}</p>
                    </div>`:""}
                `,f.appendChild(c)})}i.addEventListener("click",()=>{g(),a.classList.toggle("painel-historico--fechado")}),l.addEventListener("click",()=>{a.classList.add("painel-historico--fechado")})}}document.addEventListener("DOMContentLoaded",async()=>{await ne();try{await Be()}catch(e){console.error("Error creating sintomas section:",e)}ie(),oe()});
