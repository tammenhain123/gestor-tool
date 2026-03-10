import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'white-label',
  clientId: 'web-client'
}

const keycloak = new Keycloak(keycloakConfig)

export default keycloak
