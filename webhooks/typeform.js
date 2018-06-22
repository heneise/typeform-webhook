'use strict'

const axios = require('axios')
const infusionAccessToken = process.env.INFUSION_ACCESS_TOKEN

module.exports.post = (event, context, callback) => {
  const formResponse = JSON.parse(event.body)
  if (!formResponse && !formResponse.form_response) {
    callback(null, { statusCode: 422 })
  }
  const formId = formResponse.form_response.form_id
  const fields = formResponse.form_response.definition.fields
  const answers = formResponse.form_response.answers
  const user = {
    firstName: findAnswerById('hd7pJz4XNpKC', fields, answers).text,
    companyName: findAnswerById('BXUeVUFYJrGp', fields, answers).text,
    email: findAnswerById('VnOdwruR6X6X', fields, answers).email,
    budget: findAnswerById('ADJzzYN59YYl', fields, answers).number,
    urgency: findAnswerById('bn3y3KssKDEm', fields, answers).number
  }
  getOrCreateInfusionCompany(user.companyName, formId, infusionAccessToken).then(companyId => {
    createInfusionContact(user, companyId, formId, infusionAccessToken).then(() => {
      callback(null, { statusCode: 200 })
    }).catch(() => {
      callback(null, { statusCode: 500 })
    })
  })
}

function findAnswerByIndex (definitionIndex, fields, answers) {
  return answers.find((el) => el.field.id === fields[definitionIndex].id) || {}
}

function findAnswerById (definitionId, fields, answers) {
  return answers.find((el) => el.field.id === definitionId) || {}
}

function createInfusionContact (user, companyId, formId, accessToken) {
  const creactAccountUrl = '/contacts'
  const request = axios.create({
    baseURL: `https://api.infusionsoft.com/crm/rest/v1`,
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return request.post(creactAccountUrl, {
    given_name: user.firstName,
    email_addresses: [{
      field: 'EMAIL1',
      email: user.email
    }],
    company: { id: companyId },
    opt_in_reason: `Contact opted-in through Typeform form #${formId}`,
    source_type: `WEBFORM`
  }).then(function (response) {
    console.log('The new user created!')
  })
}

function getOrCreateInfusionCompany (name, formId, accessToken) {
  const url = '/companies'
  const request = axios.create({
    baseURL: `https://api.infusionsoft.com/crm/rest/v1`,
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return request.get(url, { company_name: name }).then((response) => {
    const companies = response.data.companies
    const existingCompany = companies.find((company) => company.company_name === name)
    if (existingCompany) {
      return existingCompany.id
    }

    return request.post(url, {
      company_name: name,
      opt_in_reason: `Contact opted-in through Typeform form #${formId}`
    }).then(function (response) {
      return response.data.id
    }).catch(function (error) {
      console.log('Error occured while creating a company!', error)
    })
  })
}
