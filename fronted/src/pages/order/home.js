/*
 * @Date: 2021-06-11 00:13:07
 * @LastEditTime: 2021-06-16 22:27:05
 */
import React, { useState, useEffect, useContext } from 'react'
import {
  PageHeader,
  Radio,
  Button,
  Card,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  InputNumber,
  message
} from 'antd'
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'

import '@style/pages/home.less'
import myAxios from '@config/myAxios'
import { PageContext } from '@config/context'
import servicePath from '@config/api'
import _ from 'lodash'
import moment from 'moment'

const { confirm } = Modal

const { Option } = Select
const dateFormat = 'YYYY-MM-DD'

const notEditOrderStatus = [2, 3]
const notAddOrderStatus = [3]

const Home = () => {
  const [form] = Form.useForm()
  const pageContext = useContext(PageContext)

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  }
  const gridStyle = {
    width: '20%',
    minWidth: '300px'
  }

  const [ordersList, setOrdersList] = useState([])
  const [filterOrderStatus, setFilterOrderStatus] = useState('1')
  const [searchDate, setSearchDate] = useState(moment())
  const [deskList, setDeskList] = useState([])
  const [serviceList, setServiceList] = useState([])
  const [dishList, setDishList] = useState([])
  const [editId, setEditId] = useState()
  const [editStatus, setEditStatus] = useState()
  const [showModal, setShowModal] = useState(false)

  const [dishTypeList, setDishTypeList] = useState({})

  useEffect(() => {
    getDeskList()
    getServiceList()
    getDishList()
    searchAllOrders()
  }, [])

  const disabledDate = (current) => current >= moment().endOf('day')

  const searchAllOrders = (status, date) => {
    myAxios(
      {
        ...servicePath.getAllOrders,
        params: {
          restaurantId: localStorage.getItem('restaurantId'),
          orderStatus: Number(status) || Number(filterOrderStatus),
          searchDate: moment(date || searchDate).format(dateFormat)
        }
      },
      (res) => {
        if (res.data.success) {
          const list = res.data.data
          setOrdersList(
            list.map((item) => ({
              id: item.orderId,
              desk: item.desk,
              service: item.service,
              orderStatus: item.orderStatus,
              totalPrice: item.totalPrice,
              orderDishes: item.findOrderDish
                .map((dish) => dish.name)
                .join(', ')
            }))
          )
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const formatOrderStatus = (str) => {
    switch (str) {
      case 1:
        return '?????????'
      case 2:
        return '???????????????'
      case 3:
        return '?????????'
      default:
        return ''
    }
  }

  const getDeskList = () => {
    myAxios(
      {
        ...servicePath.getAllEmptyChildDesk,
        params: {
          restaurantId: localStorage.getItem('restaurantId')
        }
      },
      (res) => {
        if (res.data.success) {
          const { list } = res.data.data
          setDeskList(
            list.map((item) => ({
              id: item.id,
              deskName: item.deskName
            }))
          )
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const getServiceList = () => {
    myAxios(
      {
        ...servicePath.getAllService,
        params: {
          restaurantId: localStorage.getItem('restaurantId')
        }
      },
      (res) => {
        if (res.data.success) {
          const { list } = res.data.data
          setServiceList(
            list.map((item) => ({
              id: item.id,
              name: item.name
            }))
          )
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const getDishList = () => {
    myAxios(
      {
        ...servicePath.getAllDish,
        params: {
          restaurantId: localStorage.getItem('restaurantId')
        }
      },
      (res) => {
        if (res.data.success) {
          const { list } = res.data.data
          setDishList(
            list.map((item) => ({
              id: item.id,
              name: item.name
            }))
          )
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const changeDishName = (value, key) => {
    myAxios(
      {
        ...servicePath.getDishKind,
        params: {
          id: value
        }
      },
      (res) => {
        if (res.data.success) {
          setDishTypeList({
            ...dishTypeList,
            [key]: res.data.data
          })
          const orderDishList = form.getFieldValue('childOrders')
          orderDishList[key].dishType = undefined
          form.setFieldsValue({
            childOrders: orderDishList
          })
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const onChangeDate = (date) => {
    setSearchDate(moment(date))
    searchAllOrders(undefined, date)
  }

  const changeFilter = (e) => {
    setFilterOrderStatus(e.target.value)
    searchAllOrders(e.target.value)
  }
  const showOrderDetail = (id) => {
    myAxios(
      {
        ...servicePath.getOrderById,
        params: {
          id
        }
      },
      (res) => {
        if (res.data.success) {
          const { order, orderdish } = res.data.data
          form.setFieldsValue({
            desk: order.restaurantChildDeskId,
            service: order.restaurantServiceId,
            childOrders: orderdish.map((item) => ({
              dishName: item.dishId,
              dishType: item.childDishId,
              dishCount: item.count
            }))
          })
          Promise.all(
            orderdish.map((item) =>
              myAxios(
                {
                  ...servicePath.getDishKind,
                  params: {
                    id: item.dishId
                  }
                },
                (response) => {
                  if (response.data.success) {
                    return response.data.data
                  }
                  message.error(response.data.message)
                },
                () => {
                  message.error('??????????????????,??????????????????')
                },
                pageContext
              )
            )
          ).then((list) => {
            const newList = {}
            list.forEach((itemList, index) => {
              newList[index] = itemList
            })
            setDishTypeList(newList)
          })
          setShowModal(true)
          setEditId(id)
          setEditStatus(order.orderStatus)
        } else {
          message.error(res.data.message)
        }
      },
      () => {
        message.error('??????????????????,??????????????????')
      },
      pageContext
    )
  }

  const handleSave = () => {
    form.validateFields().then(() => {
      const formValue = form.getFieldsValue()
      if (!formValue.childOrders) {
        message.error('???????????????')
        return
      }
      const orderForm = {
        orderedBy: localStorage.getItem('userId'),
        restaurantServiceId: formValue.service,
        restaurantChildDeskId: formValue.desk,
        restaurantId: localStorage.getItem('restaurantId')
      }
      const childOrderForm = formValue.childOrders.map((item) => {
        let typePrice
        Object.keys(dishTypeList).forEach((key) => {
          const dishType = dishTypeList[key]
          const findType = _.find(dishType, (type) => type.id === item.dishType)
          if (findType) {
            typePrice = findType.price * item.dishCount
          }
        })
        return {
          dishId: item.dishName,
          childDishId: item.dishType,
          count: item.dishCount,
          price: typePrice
        }
      })
      orderForm.totalPrice = _.sumBy(childOrderForm, 'price')
      myAxios(
        {
          ...servicePath.operateOrder,
          data: {
            id: editId,
            orderForm,
            childOrderForm
          }
        },
        (res) => {
          if (res.data.success) {
            message.success('????????????')
            handleCancel()
            getDeskList()
            searchAllOrders()
          } else {
            message.error(res.data.message)
          }
        },
        () => {
          message.error('????????????,??????????????????')
        },
        pageContext
      )
    })
  }
  const handleCancel = () => {
    form.resetFields()
    setEditId()
    setEditStatus()
    setDishTypeList({})
    setShowModal(false)
  }

  const handleAddOrder = () => {
    setShowModal(true)
  }

  const deleteOrder = (id) => {
    confirm({
      title: '????????????????????????????',
      icon: <ExclamationCircleOutlined />,
      cancelText: '??????',
      okText: '??????',
      onOk() {
        myAxios(
          {
            ...servicePath.deleteOrderById,
            params: {
              id
            }
          },
          (res) => {
            if (res.data.success) {
              message.success('????????????')
              searchAllOrders()
            } else {
              message.error(res.data.message)
              return Promise.reject()
            }
          },
          () => {
            message.error('????????????,??????????????????')
            return Promise.reject()
          },
          pageContext
        )
      }
    })
  }

  const waitOrderPay = (id) => {
    myAxios(
      {
        ...servicePath.waitOrderPay,
        params: {
          id
        }
      },
      (res) => {
        if (res.data.success) {
          message.success('????????????')
          searchAllOrders()
        } else {
          message.error(res.data.message)
          return Promise.reject()
        }
      },
      () => {
        message.error('????????????,??????????????????')
        return Promise.reject()
      },
      pageContext
    )
  }

  const payOrder = (id) => {
    myAxios(
      {
        ...servicePath.payOrderById,
        params: {
          id
        }
      },
      (res) => {
        if (res.data.success) {
          message.success('????????????')
          getDeskList()
          searchAllOrders()
        } else {
          message.error(res.data.message)
          return Promise.reject()
        }
      },
      () => {
        message.error('????????????,??????????????????')
        return Promise.reject()
      },
      pageContext
    )
  }

  return (
    <div className="order-container">
      <PageHeader className="site-page-header" title="????????????" />
      <div className="order-body">
        <div className="order-header">
          <div>
            <Radio.Group
              value={filterOrderStatus}
              buttonStyle="solid"
              onChange={changeFilter}
            >
              <Radio.Button value="-1">????????????</Radio.Button>
              <Radio.Button value="1">?????????</Radio.Button>
              <Radio.Button value="2">?????????</Radio.Button>
              <Radio.Button value="3">?????????</Radio.Button>
            </Radio.Group>
            <DatePicker
              onChange={onChangeDate}
              value={searchDate}
              style={{ marginLeft: 20 }}
              disabledDate={disabledDate}
            />
          </div>
          <Button type="primary" onClick={handleAddOrder}>
            ????????????
          </Button>
        </div>
        <div className="order-body">
          <Card title="????????????">
            {ordersList.map((order) => (
              <Card.Grid style={gridStyle} key={order.id}>
                <div className="order-item">
                  <div className="order-row">
                    <div>
                      <span>????????????:</span>
                      <span>{order.id}</span>
                    </div>
                    <div>
                      <span>??????:</span>
                      <span>{order.desk}</span>
                    </div>
                  </div>
                  <div className="order-row-item">
                    <span>????????????:</span>
                    <span>{order.service}</span>
                  </div>
                  <div className="order-row-item">
                    <span>????????????:</span>
                    <span>{order.orderDishes}</span>
                  </div>
                  <div className="order-row">
                    <div>
                      <span>??????:</span>
                      <span>{order.totalPrice}</span>
                    </div>
                    <div>
                      <span>????????????:</span>
                      <span>{formatOrderStatus(order.orderStatus)}</span>
                    </div>
                  </div>
                  <div className="order-footer">
                    <div className="order-btn">
                      <Button onClick={() => showOrderDetail(order.id)}>
                        ????????????
                      </Button>
                      <Button
                        onClick={() => waitOrderPay(order.id)}
                        disabled={order.orderStatus !== 1}
                      >
                        ?????????
                      </Button>
                    </div>
                    <div className="order-btn">
                      <Button
                        onClick={() => {
                          deleteOrder(order.id)
                        }}
                        disabled={order.orderStatus !== 1}
                      >
                        ????????????
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => {
                          payOrder(order.id)
                        }}
                      >
                        ??????
                      </Button>
                    </div>
                  </div>
                </div>
              </Card.Grid>
            ))}
          </Card>
        </div>
      </div>
      <Modal
        title="????????????"
        visible={showModal}
        maskClosable={false}
        okText="??????"
        width={800}
        onOk={handleSave}
        onCancel={handleCancel}
        className="order-modal"
      >
        <Form {...layout} form={form}>
          <Form.Item name="desk" label="??????" rules={[{ required: true }]}>
            <Select placeholder="???????????????" size="large" disabled={editId}>
              {deskList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.deskName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="service"
            label="????????????"
            rules={[{ required: true }]}
          >
            <Select placeholder="?????????????????????" size="large" disabled={editId}>
              {serviceList.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <p className="order-title">
            <span>????????????</span>
          </p>
          <Form.List name="childOrders">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, fieldKey, ...restField }) => (
                  <Space
                    key={key}
                    style={{
                      display: 'flex',
                      marginBottom: 8,
                      justifyContent: 'center'
                    }}
                    align="baseline"
                  >
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, 'dishName']}
                        fieldKey={[fieldKey, 'dishName']}
                        label="??????"
                        rules={[{ required: true, message: '?????????????????????' }]}
                      >
                        <Select
                          placeholder="?????????????????????"
                          size="large"
                          onChange={(value) => changeDishName(value, key)}
                        >
                          {dishList.map((item) => (
                            <Option key={item.id} value={item.id}>
                              {item.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'dishCount']}
                        fieldKey={[fieldKey, 'dishCount']}
                        label="??????"
                        rules={[{ required: true, message: '?????????????????????' }]}
                      >
                        <InputNumber
                          placeholder="?????????????????????"
                          min={0}
                          size="large"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, 'dishType']}
                        fieldKey={[fieldKey, 'dishType']}
                        label="??????"
                        rules={[{ required: true, message: '?????????????????????' }]}
                      >
                        <Select placeholder="?????????????????????" size="large">
                          {(dishTypeList[key] || []).map((item) => (
                            <Option key={item.id} value={item.id}>
                              {item.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    {!notEditOrderStatus.includes(editStatus) && (
                      <MinusCircleOutlined
                        style={{ marginLeft: 20 }}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>
                ))}
                {!notAddOrderStatus.includes(editStatus) && (
                  <Form.Item wrapperCol={{ span: 24 }}>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      style={{ width: '100%' }}
                      icon={<PlusOutlined />}
                    >
                      ????????????
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default Home
