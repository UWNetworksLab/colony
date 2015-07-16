# adapted from: https://github.com/Nyr/openvpn-install/blob/master/openvpn-install.sh
# Expecting to run in ubuntu 14.04

if [ -f /etc/openvpn/client.ovpn ]; then
  exit 0;
fi

apt-get install -y openvpn easy-rsa

# generate certs
if [[ -d /etc/openvpn/easy-rsa ]]; then
  rm -r /etc/openvpn/easy-rsa
fi
cp -r /usr/share/easy-rsa /etc/openvpn
cd /etc/openvpn/easy-rsa
echo "export KEY_CONFIG=/etc/openvpn/easy-rsa/openssl-1.0.0.cnf" >> vars
chmod 755 *
source ./vars
./vars
./clean-all
./pkitool --initca
./pkitool --server server
./build-dh

# make openvpn server config
IP=$(wget -qO- ifconfig.me/ip)
cp /usr/share/doc/openvpn/examples/sample-config-files/server.conf.gz /etc/openvpn/
cd /etc/openvpn/
gunzip server.conf.gz
sed -i 's|dh dh1024.pem|dh /etc/openvpn/dh2048.pem|' server.conf
sed -i 's|ca.crt|/etc/openvpn/ca.crt|' server.conf
sed -i 's|server.crt|/etc/openvpn/server.crt|' server.conf
sed -i 's|server.key|/etc/openvpn/server.key|' server.conf
sed -i 's|;push "redirect-gateway def1 bypass-dhcp"|push "redirect-gateway def1 bypass-dhcp"|' server.conf
sed -i 's|;push "dhcp-option DNS 208.67.222.222"|push "dhcp-option DNS 74.82.42.42"|' server.conf

cp /etc/openvpn/easy-rsa/keys/dh2048.pem /etc/openvpn
cp /etc/openvpn/easy-rsa/keys/ca.crt /etc/openvpn
cp /etc/openvpn/easy-rsa/keys/server.crt /etc/openvpn
cp /etc/openvpn/easy-rsa/keys/server.key /etc/openvpn

# setup iptables
sed -i 's/#net.ipv4.ip_forward/net.ipv4.ip_forward/g' /etc/sysctl.conf
sysctl -p

iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -j SNAT --to $IP
sed -i "1 a\iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -j SNAT --to $IP" /etc/rc.local

# exporting client behavior
cd /etc/openvpn/easy-rsa
./pkitool client
cp /usr/share/doc/openvpn/examples/sample-config-files/client.conf /etc/openvpn/client.ovpn

sed -i "s|remote my-server-1|remote $IP|" /etc/openvpn/client.ovpn
#remove the external files.
sed -i "/ca ca.crt/d" /etc/openvpn/client.ovpn
sed -i "/cert client.crt/d" /etc/openvpn/client.ovpn
sed -i "/key client.key/d" /etc/openvpn/client.ovpn
#replace them with inlined versions.
echo "<ca>" >> /etc/openvpn/client.ovpn
cat /etc/openvpn/easy-rsa/keys/ca.crt >> /etc/openvpn/client.ovpn
echo "</ca>" >> /etc/openvpn/client.ovpn
echo "<cert>" >> /etc/openvpn/client.ovpn
cat /etc/openvpn/easy-rsa/keys/client.crt >> /etc/openvpn/client.ovpn
echo "</cert>" >> /etc/openvpn/client.ovpn
echo "<key>" >> /etc/openvpn/client.ovpn
cat /etc/openvpn/easy-rsa/keys/client.key >> /etc/openvpn/client.ovpn
echo "</key>" >> /etc/openvpn/client.ovpn

service openvpn restart
