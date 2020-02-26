const {main} = require("junk-bucket");
const {Future} = require("junk-bucket/future");
const {Context} = require("junk-bucket/context");

const publicIp = require("public-ip");
const {Resolver, ADDRCONFIG} = require('dns');

main(async (l) => {
	const serviceContext = new Context("ip-dns-monitor", l);

	const hostName = process.env['MONITOR_HOSTNAME'];
	if( !hostName ) { throw new Error("env var MONITOR_HOSTNAME required"); }
	const dnsServer = process.env['MONITOR_DNS'];
	if( !dnsServer ) { throw new Error("env var MONITOR_DNS required"); }

	//check
	const myPublicIP = await publicIp.v4();
	const resolver = new Resolver();
	resolver.setServers([dnsServer]);

	const resolvedSignal = new Future();
	resolver.resolve4(hostName, (err,addresses) => {
		if( err ) { return resolvedSignal.reject(err); }
		resolvedSignal.accept(addresses);
	});
	const resolved = await resolvedSignal.promised;

	const targetMatches = resolved.includes(myPublicIP);
	if( targetMatches ) {
		serviceContext.logger.info("Hostname maps to IP address");
	} else {
		serviceContext.logger.info("Hostname does not map ", {myPublicIP, resolved});
	}
});
