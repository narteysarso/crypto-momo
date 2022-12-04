import { Button, Card, Col, Form, Input, Layout, Menu, Row } from 'antd';
import { useSigner } from 'wagmi';
import { getTokenContract, getWalletContract } from './helper';
import { IERC20 } from './abis/IERC20';
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const { Header, Content, Footer } = Layout;

const Home = () => {

    const { data: signer } = useSigner();

    const onFinish = async (values) => {

        console.log(values);

        const { phonenumber, amount, tokenAddress } = values;

        const walletContract = getWalletContract();

        console.log(walletContract);

        const recipientAddress = await walletContract.addressOfPhonenumber(phonenumber);

        console.log(recipientAddress);

        const tokenContract = getTokenContract(tokenAddress, IERC20.abi);

        console.log(signer);

        const txn = await tokenContract.connect(signer).transfer(recipientAddress, ethers.utils.parseEther(amount));

        await txn.wait();
    }

    return (
        <Layout className="layout" style={{background: "#ffffff77", height: "100vh"}}>
            <Header>
                <div className="logo" />
                <div style={{display: "flex", flexSize: "1", justifyContent: "end", alignItems: "center", padding: "5px" }}>
                    <ConnectButton />
                </div>
            </Header>

            <Content
                style={{
                    padding: '50px',
                    background:"transparent"
                }}
            >

                <div className="site-layout-content">
                    <Row justify={"center"} align={"middle"}>
                        <Col span={{ xs: 24, md: 18, lg: 12 }}>
                            <Card title={"Drop tokens to a phone number"}>
                                <Form
                                    name="basic"
                                    labelCol={{ span: 8 }}
                                    wrapperCol={{ span: 16 }}
                                    initialValues={{ remember: true }}
                                    onFinish={onFinish}
                                    autoComplete="off"
                                >
                                    <Form.Item
                                        label="Phonenumber"
                                        name="phonenumber"
                                        rules={[{ required: true, message: 'Please input recipient phone number' }]}
                                    >
                                        <Input htmlType='tel' />
                                    </Form.Item>

                                    <Form.Item
                                        label="Token Address"
                                        name="tokenAddress"
                                        rules={[{ required: true, message: 'Please input token address' }]}
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Form.Item
                                        label="Amount"
                                        name="amount"
                                        rules={[{ required: true, message: 'Please input amount' }]}
                                    >
                                        <Input type='number' step={0.001} />
                                    </Form.Item>


                                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                        <Button type="primary" htmlType="submit">
                                            Submit
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Content>
            <Footer
                style={{
                    textAlign: 'center',
                    background: "transparent"
                }}
            >
                CryptoMomo ©2018 Created by <a href="https://narteykodjosarso.vercel.app/">Nartey Kodjo-Sarso</a>
            </Footer>
        </Layout>
    )
}

export default Home;