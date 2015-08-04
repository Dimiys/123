package org.wf.dp.dniprorada.dao;

import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.criterion.Restrictions;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Required;
import org.wf.dp.dniprorada.model.EntityNotFoundException;
import org.wf.dp.dniprorada.model.HistoryEvent_Service;
import org.wf.dp.dniprorada.util.AlgorithmLuna;
import org.apache.log4j.Logger;


public class HistoryEvent_ServiceDaoImpl implements HistoryEvent_ServiceDao{

    private SessionFactory sessionFactory;
    private static final Logger log = Logger.getLogger(HistoryEvent_ServiceDaoImpl.class);

    @Required
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    private Session getSession() {
        return sessionFactory.getCurrentSession();
    }

    public void setSessionFactory(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HistoryEvent_Service getHistoryEvent_ServiceBynID(Long nID) {
        Criteria criteria = getSession().createCriteria(HistoryEvent_Service.class);
        criteria.add(Restrictions.eq("id", nID));
        return (HistoryEvent_Service) criteria.uniqueResult();
    }
    
    @Override
    public HistoryEvent_Service getHistoryEvent_ServiceBysID(String sID) {
        Criteria criteria = getSession().createCriteria(HistoryEvent_Service.class);
        criteria.add(Restrictions.eq("sID", sID));
        return (HistoryEvent_Service) criteria.uniqueResult();
    }

    @Override
    public HistoryEvent_Service getHistoryEvent_ServiceByID_Protected(Long nID_Protected) {
        if (!AlgorithmLuna.checkProtectedNumber(nID_Protected)) {
            log.warn("CRC Error");
            throw new IllegalArgumentException("CRC Error");
        }
        Criteria criteria = getSession().createCriteria(HistoryEvent_Service.class);
        criteria.add(Restrictions.eq("id", nID_Protected / 10));
        HistoryEvent_Service event_service = (HistoryEvent_Service) criteria.uniqueResult();
        if (event_service == null) {
            log.warn("Record not found");
            throw new EntityNotFoundException("Record not found");
        } else {
            log.info("Ok");
            event_service.setnID_Protected(nID_Protected);
        }
        return event_service;
    }

    @Override
    public HistoryEvent_Service addHistoryEvent_Service(Long nID_task, String sStatus, Long nID_subject, String sID_status) {
        HistoryEvent_Service event_service = new HistoryEvent_Service();
        event_service.setnID_Task(nID_task);
        event_service.setsStatus(sStatus);
        event_service.setsID_Status(sID_status);
        event_service.setnID_Subject(nID_subject);
        event_service.setsDate(new DateTime());
//        SimpleDateFormat sdf = new SimpleDateFormat("_yyyy-MM-dd_HH:mm:ss");
//        event_service.setsID(sdf.format(new Date()));
        //event_service.setnID_Protected(1L);
        Session session = getSession();
        session.saveOrUpdate(event_service);
        Long nID = event_service.getId();
//        event_service.setsID(AlgorithmLuna.getProtectedString(nID, nID_subject, sID_status));
        event_service.setnID_Protected(AlgorithmLuna.getProtectedNumber(nID));
//        session.saveOrUpdate(event_service);
        return event_service;
    }

    @Override
    public void updateHistoryEvent_Service(
    		//Long nID_Protected, 
    		Long nID,
    		String sStatus, String sID_status) {
        HistoryEvent_Service event_service;
        try {
            //event_service = getHistoryEvent_ServiceByID_Protected(nID_Protected);
        	event_service = getHistoryEvent_ServiceBynID(nID);
        } catch (RuntimeException e){
            throw new RuntimeException(e.getMessage(), e);
        }
        boolean isChanged = false;
        if (!event_service.getsStatus().equals(sStatus)){
            event_service.setsStatus(sStatus);
            isChanged = true;
        }
        if (sID_status != null && !sID_status.equals(event_service.getsID_Status())) {
            event_service.setsID_Status(sID_status);
            isChanged = true;
        }
        if (isChanged) {
        	event_service.setsDate(new DateTime());
            getSession().saveOrUpdate(event_service);
        }
    }

}
